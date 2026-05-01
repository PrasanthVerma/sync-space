const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { executeCode } = require('./runner');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/execute', async (req, res) => {
    const { code, language } = req.body;
    
    if (!code || !language) {
        return res.status(400).json({ success: false, error: 'Code and language are required' });
    }

    try {
        const result = await executeCode(language, code);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || 'Execution failed' });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Execution Engine running on port ${PORT}`);
});
