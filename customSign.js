// Custom sign function - skip actual signing
module.exports = async function(configuration) {
  console.log("Skipping code signing...");
  return null;
};
