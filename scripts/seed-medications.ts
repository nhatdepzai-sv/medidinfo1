
import { db } from '../server/db';
import { medications } from '../shared/schema';
import { medicationsDatabase } from '../server/medications-database';
import { fullComprehensiveDrugsDatabase } from '../server/comprehensive-drugs-database';
import { globalMedicationsDatabase } from '../server/global-medications-database';
import { randomUUID } from 'crypto';

async function seedMedications() {
  console.log('🌱 Starting medication database seeding...');
  
  // Combine all medication sources
  const allMedications = [
    ...medicationsDatabase,
    ...fullComprehensiveDrugsDatabase,
    ...globalMedicationsDatabase
  ];
  
  console.log(`📊 Total medications to insert: ${allMedications.length}`);
  
  const batchSize = 1000;
  let inserted = 0;
  
  for (let i = 0; i < allMedications.length; i += batchSize) {
    const batch = allMedications.slice(i, i + batchSize);
    const medicationsWithIds = batch.map(med => ({
      ...med,
      id: randomUUID()
    }));
    
    try {
      await db.insert(medications).values(medicationsWithIds);
      inserted += batch.length;
      console.log(`✅ Inserted ${inserted}/${allMedications.length} medications`);
    } catch (error) {
      console.error(`❌ Error inserting batch starting at ${i}:`, error);
    }
  }
  
  console.log('🎉 Medication seeding complete!');
  process.exit(0);
}

seedMedications().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
