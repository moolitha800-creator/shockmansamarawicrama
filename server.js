const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.resolve(__dirname, 'auction_db.json');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public/uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const readDB = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const writeDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// API endpoint for GET all or single
app.get('/api/applicant', (req, res) => {
    const applicantId = req.query.id;
    try {
        const data = readDB();
        if (applicantId) {
            const applicant = data.applicants.find(a => a.applicant_id === applicantId);
            if (applicant) {
                res.json({ success: true, data: applicant });
            } else {
                res.status(404).json({ success: false, message: 'Applicant not found' });
            }
        } else {
            res.json({ success: true, data: data.applicants });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API endpoint for POST (Upsert)
app.post('/api/applicant', upload.single('vehicle_image_file'), (req, res) => {
    const newApplicant = req.body;
    
    if (req.file) {
        newApplicant.vehicle_image = 'uploads/' + req.file.filename;
    }
    
    try {
        const data = readDB();
        let updated = false;
        
        for (let i = 0; i < data.applicants.length; i++) {
            if (data.applicants[i].applicant_id === newApplicant.applicant_id) {
                newApplicant.id = data.applicants[i].id;
                if (!newApplicant.vehicle_image && !req.body.vehicle_image) {
                    newApplicant.vehicle_image = data.applicants[i].vehicle_image;
                }
                data.applicants[i] = newApplicant;
                updated = true;
                break;
            }
        }
        
        if (!updated) {
            newApplicant.id = Date.now();
            data.applicants.push(newApplicant);
        }
        
        writeDB(data);
        res.status(201).json({ success: true, id: newApplicant.id, action: updated ? 'updated' : 'created' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API endpoint for DELETE
app.delete('/api/applicant', (req, res) => {
    const id = req.query.id;
    if (!id) return res.status(400).json({ success: false, error: 'ID is required' });
    
    try {
        const data = readDB();
        const initialCount = data.applicants.length;
        data.applicants = data.applicants.filter(a => a.applicant_id !== id);
        
        if (data.applicants.length < initialCount) {
            writeDB(data);
            res.json({ success: true, message: 'Deleted successfully' });
        } else {
            res.status(404).json({ success: false, error: 'Applicant not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
