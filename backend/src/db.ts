import knex, { Knex } from 'knex';
import logger from './utils/logger';

let db: Knex;

// In-memory storage fallback for when PostgreSQL is not available
interface InMemoryStorage {
  projects: any[];
  mrvSubmissions: any[];
  transactions: any[];
}

let inMemoryStorage: InMemoryStorage = {
  projects: [],
  mrvSubmissions: [],
  transactions: []
};

export async function initDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    try {
      // Initialize PostgreSQL connection
      db = knex({
        client: 'pg',
        connection: databaseUrl,
        pool: {
          min: 2,
          max: 10
        },
        migrations: {
          tableName: 'knex_migrations'
        }
      });

      // Test connection
      await db.raw('SELECT 1');
      
      // Create tables if they don't exist
      await createTables();
      
      logger.info('✅ Connected to PostgreSQL database');
    } catch (error) {
      logger.warn('❌ Failed to connect to PostgreSQL, falling back to in-memory storage:', error);
      db = null as any;
    }
  } else {
    logger.info('📝 Using in-memory storage (no DATABASE_URL provided)');
    db = null as any;
  }
}

async function createTables(): Promise<void> {
  if (!db) return;

  // Projects table
  const hasProjectsTable = await db.schema.hasTable('projects');
  if (!hasProjectsTable) {
    await db.schema.createTable('projects', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.string('owner_address').notNullable();
      table.string('geojson_cid');
      table.string('metadata_cid');
      table.boolean('active').defaultTo(true);
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
      table.index(['owner_address', 'active']);
    });
    logger.info('✅ Created projects table');
  }

  // MRV submissions table
  const hasMrvTable = await db.schema.hasTable('mrv_submissions');
  if (!hasMrvTable) {
    await db.schema.createTable('mrv_submissions', (table) => {
      table.increments('id').primary();
      table.integer('project_id').references('id').inTable('projects').onDelete('CASCADE');
      table.string('package_cid').notNullable();
      table.decimal('carbon_tonnes', 10, 2).notNullable();
      table.enum('status', ['submitted', 'approved', 'rejected']).defaultTo('submitted');
      table.string('verifier_address');
      table.text('notes');
      table.string('blockchain_tx_hash');
      table.timestamp('submitted_at').defaultTo(db.fn.now());
      table.timestamp('processed_at');
      table.index(['project_id', 'status']);
      table.index(['status']);
    });
    logger.info('✅ Created mrv_submissions table');
  }

  // Transactions table for market activities
  const hasTransactionsTable = await db.schema.hasTable('transactions');
  if (!hasTransactionsTable) {
    await db.schema.createTable('transactions', (table) => {
      table.increments('id').primary();
      table.string('tx_hash').unique().notNullable();
      table.enum('type', ['mint', 'transfer', 'retire']).notNullable();
      table.string('from_address');
      table.string('to_address');
      table.decimal('amount', 18, 0).notNullable();
      table.text('metadata');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.index(['type', 'from_address']);
      table.index(['type', 'to_address']);
    });
    logger.info('✅ Created transactions table');
  }
}

// Database operations with fallback to in-memory storage
export class Database {
  
  // Projects operations
  static async createProject(projectData: any): Promise<any> {
    if (db) {
      const [project] = await db('projects').insert(projectData).returning('*');
      return project;
    } else {
      const project = {
        id: inMemoryStorage.projects.length + 1,
        ...projectData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      inMemoryStorage.projects.push(project);
      return project;
    }
  }

  static async getProject(id: number): Promise<any> {
    if (db) {
      return await db('projects').where('id', id).first();
    } else {
      return inMemoryStorage.projects.find(p => p.id === id);
    }
  }

  static async getProjectsByOwner(ownerAddress: string): Promise<any[]> {
    if (db) {
      return await db('projects').where('owner_address', ownerAddress).orderBy('created_at', 'desc');
    } else {
      return inMemoryStorage.projects.filter(p => p.owner_address === ownerAddress);
    }
  }

  static async getAllProjects(limit = 50, offset = 0): Promise<any[]> {
    if (db) {
      return await db('projects').orderBy('created_at', 'desc').limit(limit).offset(offset);
    } else {
      return inMemoryStorage.projects.slice(offset, offset + limit);
    }
  }

  // MRV operations
  static async createMRVSubmission(mrvData: any): Promise<any> {
    if (db) {
      const [mrv] = await db('mrv_submissions').insert(mrvData).returning('*');
      return mrv;
    } else {
      const mrv = {
        id: inMemoryStorage.mrvSubmissions.length + 1,
        ...mrvData,
        submitted_at: new Date().toISOString()
      };
      inMemoryStorage.mrvSubmissions.push(mrv);
      return mrv;
    }
  }

  static async getMRVSubmission(id: number): Promise<any> {
    if (db) {
      return await db('mrv_submissions').where('id', id).first();
    } else {
      return inMemoryStorage.mrvSubmissions.find(m => m.id === id);
    }
  }

  static async updateMRVSubmission(id: number, updates: any): Promise<any> {
    if (db) {
      const [mrv] = await db('mrv_submissions').where('id', id).update({
        ...updates,
        updated_at: db.fn.now()
      }).returning('*');
      return mrv;
    } else {
      const index = inMemoryStorage.mrvSubmissions.findIndex(m => m.id === id);
      if (index !== -1) {
        inMemoryStorage.mrvSubmissions[index] = {
          ...inMemoryStorage.mrvSubmissions[index],
          ...updates
        };
        return inMemoryStorage.mrvSubmissions[index];
      }
      return null;
    }
  }

  static async getMRVSubmissionsByStatus(status: string): Promise<any[]> {
    if (db) {
      return await db('mrv_submissions')
        .where('status', status)
        .join('projects', 'mrv_submissions.project_id', 'projects.id')
        .select('mrv_submissions.*', 'projects.name as project_name', 'projects.owner_address')
        .orderBy('mrv_submissions.submitted_at', 'desc');
    } else {
      return inMemoryStorage.mrvSubmissions
        .filter(m => m.status === status)
        .map(m => {
          const project = inMemoryStorage.projects.find(p => p.id === m.project_id);
          return {
            ...m,
            project_name: project?.name,
            owner_address: project?.owner_address
          };
        });
    }
  }

  // Transactions operations
  static async createTransaction(txData: any): Promise<any> {
    if (db) {
      const [tx] = await db('transactions').insert(txData).returning('*');
      return tx;
    } else {
      const tx = {
        id: inMemoryStorage.transactions.length + 1,
        ...txData,
        created_at: new Date().toISOString()
      };
      inMemoryStorage.transactions.push(tx);
      return tx;
    }
  }

  static async getTransactionsByAddress(address: string): Promise<any[]> {
    if (db) {
      return await db('transactions')
        .where('from_address', address)
        .orWhere('to_address', address)
        .orderBy('created_at', 'desc');
    } else {
      return inMemoryStorage.transactions.filter(
        t => t.from_address === address || t.to_address === address
      );
    }
  }
}

export default db;