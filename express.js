const express = require('express');

const fs = require('fs');
const fsPromises = fs.promises;

const formidable = require('formidable');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser'); // Import the body-parser middleware
const cors = require("cors"); // Import the cors package
const xss = require("xss");
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public')));
// Use the cors middleware to enable CORS
app.use(cors());

const filePath = path.join(__dirname, 'database/contacts.json');

// Define a route to serve the index.html file
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(indexPath);
});

// Create a new contact
app.post('/contacts', (req, res) => {

    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields) => {

        if (err) {
            res.status(500).json({ status: 500, message: 'Internal Server Error' });
            return;
        }

        // Extract contact information from parsed fields
        const email = xss(fields.email);
        const name = xss(fields.name);
        const subject = xss(fields.subject);
        try {

            let existingData = [];
            await fs.promises.access(filePath, fs.constants.W_OK)
                .then(() => console.log('Can be accessed'))
                .catch(() => console.error('Can not be accessed'));

            const fileContent = await fs.promises.readFile(filePath, 'utf8');
            existingData = JSON.parse(fileContent);

            // Check if the email is already registered
            if (existingData.some(contact => contact.email === email)) {
                res.status(400).json({ status: 400, message: 'Email is already registered' });
                return;
            }

            // Create a new contact object with a generated UUID
            const contact = {
                id: uuidv4(), // Generate a UUID for the contact ID
                email,
                name,
                subject,
            };

            // Add the new contact to the existing data
            existingData.push(contact);

            // Write the combined data back to the file
            await fs.promises.writeFile(filePath, JSON.stringify(existingData, null, 2), 'utf8');

            // Respond with the created contact
            res.status(200).json({ status: 200, message: 'Contact added successfully' });

        } catch (error) {
            res.status(500).json({ status: 500, message: 'Internal Server Error Try Catch' });
        }
    });
});


// Read all contacts
app.get('/contacts', (req, res) => {
    // Check if the file exists
    if (fs.existsSync(filePath)) {
        // Read the file content and parse it as JSON
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const contacts = JSON.parse(fileContent);

        // Respond with the list of contacts
        res.status(200).json(contacts);
    } else {
        // Respond with an empty list if the file doesn't exist
        res.status(200).json([]);
    }
});

// Read a specific contact by ID
app.get('/contacts/:id', (req, res) => {
    const contactId = req.params.id;

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        // Read the file content and parse it as JSON
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const contacts = JSON.parse(fileContent);

        // Find the contact with the specified ID
        const contact = contacts.find((c) => c.id === contactId);

        if (contact) {
            // Respond with the found contact
            res.status(200).json(contact);
        } else {
            // Respond with a 404 if the contact is not found
            res.status(404).json({ status: 404, message: 'Contact not found.' });
        }
    } else {
        // Respond with a 404 if the file doesn't exist
        res.status(404).json({ status: 404, message: 'Contact not found.' });
    }
});

// Update a specific contact by ID
app.put('/contacts/:id', (req, res) => {
    const contactId = req.params.id;
    const updateData = req.body;

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        // Read the file content and parse it as JSON
        const fileContent = fs.readFileSync(filePath, 'utf8');
        let contacts = JSON.parse(fileContent);

        // Find the index of the contact to update
        const index = contacts.findIndex((c) => c.id === contactId);

        if (index !== -1) {
            // Update the contact's data
            contacts[index] = { ...contacts[index], ...updateData };

            // Write the updated contacts back to the file
            fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2), 'utf8');

            // Respond with the updated contact
            res.status(200).json({ status: 200, contact: contacts[index] });
        } else {
            // Respond with a 404 if the contact is not found
            res.status(404).json({ status: 404, message: 'Contact not found.' });
        }
    } else {
        // Respond with a 404 if the file doesn't exist
        res.status(404).json({ status: 404, message: 'Contact not found.' });
    }
});

// Delete a specific contact by ID
app.delete('/contacts/:id', (req, res) => {
    const contactId = req.params.id;

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        // Read the file content and parse it as JSON
        const fileContent = fs.readFileSync(filePath, 'utf8');
        let contacts = JSON.parse(fileContent);

        // Filter out the contact to be deleted
        const filteredContacts = contacts.filter((c) => c.id !== contactId);

        if (contacts.length !== filteredContacts.length) {
            // Write the filtered contacts back to the file
            fs.writeFileSync(filePath, JSON.stringify(filteredContacts, null, 2), 'utf8');

            // Respond with a success message
            res.status(200).json({ status: 200, message: 'Contact deleted successfully.' });
        } else {
            // Respond with a 404 if the contact is not found
            res.status(404).json({ status: 404, message: 'Contact not found.' });
        }
    } else {
        // Respond with a 404 if the file doesn't exist
        res.status(404).json({ status: 404, message: 'Contact not found.' });
    }
});

// Delete all contacts
app.delete('/contacts', (req, res) => {

    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields) => {

        if (err) {
            res.status(500).json({ status: 500, message: 'Internal Server Error' });
            return;
        }
        // Extract contact information from parsed fields
        const { all } = fields;
        if (all[0] == 'true') {

            // Write the combined data back to the file
            //fs.writeFileSync(filePath, '[]', 'utf8');

            // Write the combined data back to the file
            await fs.promises.writeFile(filePath, '[]', 'utf8');

            // Respond with the created contact
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 200, message: 'All contacts deleted successfully.' }));
        } else {
            // Respond with a bad request if the query parameter is missing or not "true"
            res.status(400).json({ status: 400, message: 'Invalid request.' });
        }
    });
});

// Catch-all route for handling unknown routes
app.use((req, res) => {
    res.status(404).json({ status: 404, message: 'Route not found.' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});