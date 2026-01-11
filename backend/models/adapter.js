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
    create: async (data) => {
      const inst = await PgProduct.create(data);
  const obj = inst.toJSON();
  obj._id = obj.id;
  obj.images = obj.images || obj.imagesJson || [];
  // normalize stock field for frontend compatibility
  obj.stock = obj.stock || obj.countInStock || 0;
  return obj;
    },
    findOne: async (query) => {
  const inst = await PgProduct.findOne({ where: query });
  if (!inst) return null;
  const obj = inst.toJSON();
  obj._id = obj.id;
  obj.images = obj.images || obj.imagesJson || [];
  obj.stock = obj.stock || obj.countInStock || 0;
  return obj;
    },
    findById: async (id) => {
  const inst = await PgProduct.findByPk(id);
  if (!inst) return null;
  const obj = inst.toJSON();
  obj._id = obj.id;
  obj.images = obj.images || obj.imagesJson || [];
  obj.stock = obj.stock || obj.countInStock || 0;
  return obj;
    },
    findByIdAndUpdate: async (id, update) => {
      const inst = await PgProduct.findByPk(id);
      if (!inst) return null;
      await inst.update(update);
      await inst.reload(); const obj = inst.toJSON(); obj._id = obj.id; obj.images = obj.images || obj.imagesJson || []; return obj;
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
      const rows = await PgProduct.findAll({ where, order });
      return rows.map(r => {
        const o = r.toJSON();
        o._id = o.id;
        o.images = o.images || o.imagesJson || [];
        o.stock = o.stock || o.countInStock || 0;
        return o;
      });
    },
    findBySlug: async (slug) => {
      const inst = await PgProduct.findOne({ where: { slug } });
      if (!inst) return null;
      const obj = inst.toJSON();
      obj._id = obj.id;
      obj.images = obj.images || obj.imagesJson || [];
      obj.stock = obj.stock || obj.countInStock || 0;
      return obj;
    },
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
    },
    // Find users by query (returns array)
    find: async (query = {}) => {
      const where = query;
      const rows = await PgUser.findAll({ where });
      return rows.map(r => { const o = r.toJSON(); o._id = o.id; o.password = o.passwordHash; return o; });
    },
    // Update user by id
    findByIdAndUpdate: async (id, update) => {
      const inst = await PgUser.findByPk(id);
      if (!inst) return null;
      // map password to passwordHash if present
      const data = { ...update };
      if (data.password) { data.passwordHash = data.password; delete data.password; }
      await inst.update(data);
      await inst.reload(); const obj = inst.toJSON(); obj._id = obj.id; obj.password = obj.passwordHash; return obj;
    }
  };

  adapter.Order = {
    create: async (data) => {
      const inst = await PgOrder.create(data);
  const obj = inst.toJSON(); obj._id = obj.id; obj.id = obj.id || obj._id; obj.items = obj.orderItems || obj.items || [];
      // normalize deliveryUpdates timestamps
      if (Array.isArray(obj.deliveryUpdates)) {
        obj.deliveryUpdates = obj.deliveryUpdates.map(u => ({ ...u, timestamp: u.timestamp || u.date || null }));
      }
  // attach user info when available
  if (obj.userId && PgUser) {
        try {
          const uInst = await PgUser.findByPk(obj.userId);
          if (uInst) { const u = uInst.toJSON(); delete u.passwordHash; u._id = u.id; obj.user = u; }
        } catch (e) { /* ignore */ }
      }
  // provide convenient top-level customer/email fields for admin UI
  obj.customer = obj.user?.name || obj.user?.fullName || obj.shippingAddress?.fullName || obj.shippingAddress?.name || null;
  obj.email = obj.user?.email || obj.shippingAddress?.email || null;
  // normalize total and date for frontend
  obj.total = obj.totalPrice ?? obj.total ?? 0;
  obj.date = obj.createdAt || obj.date || null;
      return obj;
    },
    find: async (query) => {
      const rows = await PgOrder.findAll({ where: query });
      return Promise.all(rows.map(async r => {
    const o = r.toJSON(); o._id = o.id; o.id = o.id || o._id; o.items = o.orderItems || o.items || [];
        if (Array.isArray(o.deliveryUpdates)) { o.deliveryUpdates = o.deliveryUpdates.map(u => ({ ...u, timestamp: u.timestamp || u.date || null })); }
  if (o.userId && PgUser) {
          try { const uInst = await PgUser.findByPk(o.userId); if (uInst) { const u = uInst.toJSON(); delete u.passwordHash; u._id = u.id; o.user = u; } } catch (e) {}
        }
  // top-level convenience fields
  o.customer = o.user?.name || o.user?.fullName || o.shippingAddress?.fullName || o.shippingAddress?.name || null;
  o.email = o.user?.email || o.shippingAddress?.email || null;
  o.total = o.totalPrice ?? o.total ?? 0;
  o.date = o.createdAt || o.date || null;
  return o;
      }));
    },
    findById: async (id) => {
      const inst = await PgOrder.findByPk(id);
    if (!inst) return null; const obj = inst.toJSON(); obj._id = obj.id; obj.id = obj.id || obj._id; obj.items = obj.orderItems || obj.items || [];
      if (Array.isArray(obj.deliveryUpdates)) { obj.deliveryUpdates = obj.deliveryUpdates.map(u => ({ ...u, timestamp: u.timestamp || u.date || null })); }
  if (obj.userId && PgUser) {
        try { const uInst = await PgUser.findByPk(obj.userId); if (uInst) { const u = uInst.toJSON(); delete u.passwordHash; u._id = u.id; obj.user = u; } } catch (e) {}
      }
  obj.customer = obj.user?.name || obj.user?.fullName || obj.shippingAddress?.fullName || obj.shippingAddress?.name || null;
  obj.email = obj.user?.email || obj.shippingAddress?.email || null;
  obj.total = obj.totalPrice ?? obj.total ?? 0;
  obj.date = obj.createdAt || obj.date || null;
  return obj;
    },
    findAll: async () => {
      const rows = await PgOrder.findAll();
      return Promise.all(rows.map(async r => {
      const o = r.toJSON(); o._id = o.id; o.id = o.id || o._id; o.items = o.orderItems || o.items || [];
        if (Array.isArray(o.deliveryUpdates)) { o.deliveryUpdates = o.deliveryUpdates.map(u => ({ ...u, timestamp: u.timestamp || u.date || null })); }
  if (o.userId && PgUser) {
          try { const uInst = await PgUser.findByPk(o.userId); if (uInst) { const u = uInst.toJSON(); delete u.passwordHash; u._id = u.id; o.user = u; } } catch (e) {}
        }
  o.customer = o.user?.name || o.user?.fullName || o.shippingAddress?.fullName || o.shippingAddress?.name || null;
  o.email = o.user?.email || o.shippingAddress?.email || null;
    o.total = o.totalPrice ?? o.total ?? 0;
    o.date = o.createdAt || o.date || null;
  return o;
      }));
    },
    findByIdAndUpdate: async (id, update) => {
      const inst = await PgOrder.findByPk(id);
      if (!inst) return null; await inst.update(update); await inst.reload(); const obj = inst.toJSON(); obj._id = obj.id; obj.id = obj.id || obj._id; obj.items = obj.orderItems || obj.items || [];
      if (Array.isArray(obj.deliveryUpdates)) { obj.deliveryUpdates = obj.deliveryUpdates.map(u => ({ ...u, timestamp: u.timestamp || u.date || null })); }
  if (obj.userId && PgUser) {
        try { const uInst = await PgUser.findByPk(obj.userId); if (uInst) { const u = uInst.toJSON(); delete u.passwordHash; u._id = u.id; obj.user = u; } } catch (e) {}
      }
  obj.customer = obj.user?.name || obj.user?.fullName || obj.shippingAddress?.fullName || obj.shippingAddress?.name || null;
  obj.email = obj.user?.email || obj.shippingAddress?.email || null;
  obj.total = obj.totalPrice ?? obj.total ?? 0;
  obj.date = obj.createdAt || obj.date || null;
  return obj;
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
