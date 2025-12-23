/*
  Adapter layer to present a consistent API to controllers.
  This version is Postgres-only (Sequelize). If Sequelize models are not available,
  adapter methods will be present but return null or empty arrays where appropriate.
*/
const pgConfig = require('../config/sequelize');

const adapter = {};

if (pgConfig && pgConfig.Product) {
  const { Product: PgProduct, User: PgUser, Order: PgOrder } = pgConfig;

  adapter.Product = {
    create: async (data) => PgProduct.create(data),
    findOne: async (query) => PgProduct.findOne({ where: query }),
    findById: async (id) => PgProduct.findByPk(id),
    findByIdAndUpdate: async (id, update) => {
      const inst = await PgProduct.findByPk(id);
      if (!inst) return null;
      await inst.update(update);
      return inst;
    },
    findByIdAndDelete: async (id) => {
      const inst = await PgProduct.findByPk(id);
      if (!inst) return null;
      await inst.destroy();
      return inst;
    },
    find: async (query = {}, opts = {}) => {
      const where = query;
      const order = opts.sort ? [[opts.sort.field, opts.sort.dir || 'DESC']] : [['createdAt', 'DESC']];
      return PgProduct.findAll({ where, order });
    },
    findBySlug: async (slug) => PgProduct.findOne({ where: { slug } }),
  };

  adapter.User = {
    findOne: async (query) => {
      const inst = await PgUser.findOne({ where: query });
      if (!inst) return null;
      const obj = inst.toJSON(); obj.password = obj.passwordHash; return obj;
    },
    create: async (data) => {
      const createData = { ...data };
      if (createData.password) { createData.passwordHash = createData.password; delete createData.password; }
      const inst = await PgUser.create(createData);
      const obj = inst.toJSON(); obj.password = obj.passwordHash; return obj;
    },
    findById: async (id) => {
      const inst = await PgUser.findByPk(id);
      if (!inst) return null; const obj = inst.toJSON(); obj._id = obj.id; obj.password = obj.passwordHash; return obj;
    },
    findByIdSelect: async (id) => {
      const inst = await PgUser.findByPk(id);
      if (!inst) return null; const obj = inst.toJSON(); delete obj.passwordHash; obj._id = obj.id; return obj;
    }
  };

  adapter.Order = {
    create: async (data) => PgOrder.create(data),
    find: async (query) => PgOrder.findAll({ where: query }),
    findById: async (id) => PgOrder.findByPk(id),
    findAll: async () => PgOrder.findAll(),
    findByIdAndUpdate: async (id, update) => {
      const inst = await PgOrder.findByPk(id);
      if (!inst) return null; await inst.update(update); return inst;
    }
  };

} else {
  // Minimal stubs when PG models are not present. Controllers should handle nulls and fall back
  // to in-memory stores where appropriate.
  adapter.Product = {
    create: async () => null,
    findOne: async () => null,
    findById: async () => null,
    findByIdAndUpdate: async () => null,
    findByIdAndDelete: async () => null,
    find: async () => [],
    findBySlug: async () => null,
  };

  adapter.User = {
    findOne: async () => null,
    create: async () => null,
    findById: async () => null,
    findByIdSelect: async () => null,
  };

  adapter.Order = {
    create: async () => null,
    find: async () => [],
    findById: async () => null,
    findAll: async () => [],
    findByIdAndUpdate: async () => null,
  };
}

module.exports = adapter;
