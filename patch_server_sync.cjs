const fs = require('fs');
let content = fs.readFileSync('server/index.js', 'utf8');

const syncRoute = `
// --- BULK SYNC ROUTES (For simple array replacement migration) ---
app.post('/api/sync/notes', authMiddleware, async (req, res) => {
  try {
    const notes = req.body;
    await Note.deleteMany({ userId: req.userId });
    const newNotes = notes.map(n => ({ ...n, userId: req.userId, _id: n.id ? n.id : new mongoose.Types.ObjectId() }));
    await Note.insertMany(newNotes);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/sync/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = req.body;
    await Task.deleteMany({ userId: req.userId });
    const newTasks = tasks.map(t => ({ ...t, userId: req.userId, _id: t.id ? t.id : new mongoose.Types.ObjectId() }));
    await Task.insertMany(newTasks);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
`;

// Insert right before app.listen
content = content.replace('app.listen(PORT', syncRoute + '\napp.listen(PORT');
fs.writeFileSync('server/index.js', content);
console.log('Added bulk sync routes');
