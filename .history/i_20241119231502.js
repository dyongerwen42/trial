const { MongoClient } = require("mongodb");

const localUri = "mongodb://localhost:27017"; // Local MongoDB URI
const remoteUri = "mongodb+srv://dyon:421142Dcdc@cluster0.66kxl.mongodb.net"; // Remote MongoDB Atlas URI

// Main function to clone all databases
async function cloneAllDatabases() {
  const localClient = new MongoClient(localUri);
  const remoteClient = new MongoClient(remoteUri);

  try {
    // Connect to both local and remote MongoDB instances
    await localClient.connect();
    await remoteClient.connect();
    console.log("Connected to both local and remote MongoDB instances.");

    // Get all database names from the local instance
    const adminDb = localClient.db().admin();
    const databases = (await adminDb.listDatabases()).databases;

    for (const dbInfo of databases) {
      const dbName = dbInfo.name;
      console.log(`Cloning database: ${dbName}`);

      // Skip system databases
      if (["admin", "config", "local"].includes(dbName)) {
        console.log(`Skipping system database: ${dbName}`);
        continue;
      }

      const localDb = localClient.db(dbName);
      const remoteDb = remoteClient.db(dbName);

      // Get all collections in the database
      const collections = await localDb.listCollections().toArray();

      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        console.log(`  Cloning collection: ${collectionName}`);

        const localCollection = localDb.collection(collectionName);
        const remoteCollection = remoteDb.collection(collectionName);

        // Fetch all documents from the local collection
        const documents = await localCollection.find().toArray();

        // Insert documents into the remote collection
        if (documents.length > 0) {
          await remoteCollection.insertMany(documents);
          console.log(
            `    Successfully cloned ${documents.length} documents to ${dbName}.${collectionName}`
          );
        } else {
          console.log(`    No documents to clone in ${dbName}.${collectionName}`);
        }
      }
    }

    console.log("Cloning complete!");
  } catch (error) {
    console.error("An error occurred during cloning:", error);
  } finally {
    await localClient.close();
    await remoteClient.close();
  }
}

// Run the script
cloneAllDatabases();
