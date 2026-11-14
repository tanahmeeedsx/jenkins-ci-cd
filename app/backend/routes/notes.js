const router = require('express').Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
    try {
        const filter = { user: req.user.id };
        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { content: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        if (req.query.archived !== undefined) filter.archived = req.query.archived === 'true';
        else filter.archived = false;

        res.json(await Note.find(filter).sort({ pinned: -1, updatedAt: -1 }));
    } catch {
        res.status(500).json({ message: 'Could not fetch notes' });
    }
});

router.post('/', async (req, res) => {
    try {
        if (!req.body.title?.trim()) return res.status(400).json({ message: 'Title is required' });
        const note = await Note.create({ ...req.body, user: req.user.id });
        res.status(201).json(note);
    } catch {
        res.status(500).json({ message: 'Could not create note' });
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const allowed = ['title', 'content', 'category', 'pinned', 'archived'];
        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([key]) => allowed.includes(key))
        );
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            updates, { new: true, runValidators: true }
        );
        if (!note) return res.status(404).json({ message: 'Note not found' });
        res.json(note);
    } catch {
        res.status(500).json({ message: 'Could not update note' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!note) return res.status(404).json({ message: 'Note not found' });
        res.json({ message: 'Note deleted successfully' });
    } catch {
        res.status(500).json({ message: 'Could not delete note' });
    }
});

module.exports = router;
