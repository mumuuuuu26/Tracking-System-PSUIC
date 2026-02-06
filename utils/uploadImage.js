const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

exports.saveImage = (base64String) => {
    if (!base64String) return null;

    try {
        // Check if directory exists
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Remove header if present (e.g., "data:image/png;base64,")
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        let buffer;
        let extension = 'png'; // default

        if (matches && matches.length === 3) {
            extension = matches[1].split('/')[1];
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            // Assume raw base64
            buffer = Buffer.from(base64String, 'base64');
        }

        const filename = `${uuidv4()}.${extension}`;
        const filepath = path.join(uploadDir, filename);

        fs.writeFileSync(filepath, buffer);

        // Return relative URL
        return `http://localhost:5002/uploads/${filename}`;
    } catch (err) {
        console.error("Image upload failed:", err);
        return null;
    }
};
