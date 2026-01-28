<#
PowerShell script to create/push a GitHub repo and enable Pages from the /docs folder.
Usage (PowerShell):
  .\scripts\publish_github_pages.ps1
  or provide params:
  .\scripts\publish_github_pages.ps1 -RepoUrl "https://github.com/owner/repo.git" -Branch main -PagesPath "/docs"

Requirements:
- Git installed and configured
- (Optional but recommended) GitHub CLI `gh` logged in (for repo creation + Pages API)
- If `gh` isn't available, the script will still add remote and push; enabling Pages may require a manual step.
#>

[CmdletBinding()]
param(
    [string]$RepoUrl = '',
    [string]$Branch = 'main',
    [string]$PagesPath = '/docs'
)

function Run-Command($cmd, $args) {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $cmd
    $psi.Arguments = $args
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $psi
    $p.Start() | Out-Null
    $stdout = $p.StandardOutput.ReadToEnd()
    $stderr = $p.StandardError.ReadToEnd()
    $p.WaitForExit()
    return @{ ExitCode = $p.ExitCode; StdOut = $stdout; StdErr = $stderr }
}

Write-Host "Starting GitHub publish script..."

# Ensure we're in a git repo
$gitCheck = Run-Command 'git' 'rev-parse --is-inside-work-tree'
if ($gitCheck.ExitCode -ne 0) {
    Write-Error "This folder is not a git repository. Initialize one first with 'git init' or run the script from the repository root."
    exit 1
}

# If RepoUrl not provided, try reading package.json repository.url
if ([string]::IsNullOrEmpty($RepoUrl)) {
    if (Test-Path package.json) {
        try {
            $pkg = Get-Content package.json -Raw | ConvertFrom-Json
            if ($pkg.repository -and $pkg.repository.url) {
                $RepoUrl = $pkg.repository.url
            }
        } catch {
            Write-Host "Could not parse package.json repository field: $_"
        }
    }
}

if ([string]::IsNullOrEmpty($RepoUrl)) {
    Write-Host "No repo URL provided and package.json.repository.url not found."
    $RepoUrl = Read-Host "Enter GitHub repo URL (e.g. https://github.com/owner/repo.git)"
}

# Clean repo URL and parse owner/repo
$repoUrlClean = $RepoUrl.Trim()
$repoUrlClean = $repoUrlClean -replace '\.git$', ''
if ($repoUrlClean -match 'github.com[:/]+([^/]+)/([^/]+)$') {
    $Owner = $Matches[1]
    $Repo = $Matches[2]
} else {
    Write-Error "Could not parse owner/repo from: $repoUrlClean"
    exit 1
}

Write-Host "Target repo: $Owner/$Repo"

# Ensure origin remote exists or add it
$remoteCheck = Run-Command 'git' 'remote get-url origin'
if ($remoteCheck.ExitCode -eq 0) {
    Write-Host "Remote 'origin' already set to: $($remoteCheck.StdOut.Trim())"
} else {
    Write-Host "Adding remote origin -> $RepoUrl"
    $add = Run-Command 'git' "remote add origin `"$RepoUrl`""
    if ($add.ExitCode -ne 0) { Write-Error "Failed to add remote: $($add.StdErr)"; exit 1 }
}

# Force branch to target branch name (rename current branch to main)
Write-Host "Ensuring branch is '$Branch'"
$branchRename = Run-Command 'git' "branch -M $Branch"
if ($branchRename.ExitCode -ne 0) { Write-Error "Failed to rename branch: $($branchRename.StdErr)"; exit 1 }

# Stage and commit (allow empty commit if nothing to commit)
Write-Host "Staging changes..."
Run-Command 'git' 'add -A' | Out-Null
$commit = Run-Command 'git' 'commit -m "chore: publish to GitHub"'
if ($commit.ExitCode -ne 0) {
    if ($commit.StdErr -match 'nothing to commit') {
        Write-Host "No changes to commit — creating an empty commit to ensure a push."
        $emptyCommit = Run-Command 'git' 'commit --allow-empty -m "chore: publish (empty commit)"'
        if ($emptyCommit.ExitCode -ne 0) { Write-Error "Empty commit failed: $($emptyCommit.StdErr)"; exit 1 }
    } else {
        Write-Host "Commit produced warnings or errors: $($commit.StdErr)"
    }
}

# Push to origin
Write-Host "Pushing to origin/$Branch..."
$push = Run-Command 'git' "push -u origin $Branch"
if ($push.ExitCode -ne 0) {
    Write-Error "Git push failed: $($push.StdErr)"
    exit 1
}
Write-Host "Pushed to origin/$Branch successfully."

# If gh CLI exists, try to ensure repo exists and enable Pages
$ghCheck = Run-Command 'gh' '--version'
if ($ghCheck.ExitCode -eq 0) {
    Write-Host "GitHub CLI detected. Using gh for repo creation and Pages configuration."
    # Try to create repo if it doesn't exist remotely
    $repoExists = Run-Command 'gh' "repo view $Owner/$Repo --json name --jq '.name'"
    if ($repoExists.ExitCode -ne 0) {
        Write-Host "Remote repository not found; creating $Owner/$Repo as public and pushing current source."
        $create = Run-Command 'gh' "repo create $Owner/$Repo --public --source=. --remote=origin --push"
        if ($create.ExitCode -ne 0) { Write-Host "gh repo create gave: $($create.StdErr)" }
    } else {
        Write-Host "Remote repository exists on GitHub."
    }

    # Enable Pages via API
    Write-Host "Enabling GitHub Pages (branch: $Branch, path: $PagesPath)..."
    $body = @{ source = @{ branch = $Branch; path = $PagesPath } } | ConvertTo-Json -Depth 5
    $tmp = New-TemporaryFile
    $body | Out-File -FilePath $tmp -Encoding utf8
    $api = Run-Command 'gh' "api --method POST /repos/$Owner/$Repo/pages --input `"$tmp`""
    Remove-Item $tmp -ErrorAction SilentlyContinue
    if ($api.ExitCode -eq 0) {
        Write-Host "GitHub Pages enabled."
    } else {
        Write-Host "Could not enable Pages via API. Server response: $($api.StdErr)"
        Write-Host "You can enable Pages manually: https://github.com/$Owner/$Repo/settings/pages"
    }
} else {
    Write-Host "GitHub CLI (gh) not found — pushed code but cannot create repo or enable Pages automatically."
    Write-Host "If the repo doesn't exist on GitHub, create it and add the remote, or install gh and run:"
    Write-Host "  gh repo create $Owner/$Repo --public --source=. --remote=origin --push"
    Write-Host "To enable Pages, visit: https://github.com/$Owner/$Repo/settings/pages and set Source -> Branch: $Branch / Folder: $PagesPath"
}

# Final info
$pagesUrl = "https://$Owner.github.io/$Repo/"
Write-Host "Done. Expected Pages URL: $pagesUrl"
Write-Host "If Pages isn't active yet, GitHub may take a minute to build the site."

exit 0
