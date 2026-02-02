const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'inquiries.json');

function readStore() {
	try {
		const raw = fs.readFileSync(DATA_PATH, 'utf8');
		return JSON.parse(raw || '[]');
	} catch (e) {
		return [];
	}
}

function writeStore(list) {
	try {
		fs.writeFileSync(DATA_PATH, JSON.stringify(list, null, 2), 'utf8');
		return true;
	} catch (e) {
		return false;
	}
}

// POST /api/inquiries
exports.createInquiry = (req, res) => {
	const { name, email, message } = req.body || {};
	if (!name || !email || !message) {
		return res.status(400).json({ success: false, message: 'name, email and message are required' });
	}
	const list = readStore();
	const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
	const item = { id, name: String(name).trim(), email: String(email).trim(), message: String(message).trim(), createdAt: Date.now() };
	list.unshift(item);
	if (!writeStore(list)) return res.status(500).json({ success: false, message: 'Failed to save inquiry' });
	return res.status(201).json({ success: true, inquiry: item });
};

// GET /api/inquiries (admin only)
exports.listInquiries = (req, res) => {
	const list = readStore();
	return res.json({ success: true, inquiries: list });
};
