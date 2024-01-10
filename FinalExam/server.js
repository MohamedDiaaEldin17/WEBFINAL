const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs'); 
const mysql = require('mysql');
const session = require('express-session');
const path = require('path'); // Import the 'path' module
const app = express(); // Initialize the express app

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Set EJS as the view engine
app.engine('ejs', ejs.renderFile);
app.set('view engine', 'ejs');
// Set EJS as the view engine

// Create MySQL connection
var connection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "root"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

// Initialize session
app.use(session({
    secret: 'loggedin',
    resave: false,
    saveUninitialized: true
}));

// Connect to index view
app.get("/", function (req, res) {
    res.render("index.ejs");
});

// Handle login form submission
app.post('/api/index', (req, res) => {
    const { username, password } = req.body;

    connection.query("SELECT * FROM employees where username = ? AND password = ? ", [username, password], (err, results) => {
        if (err) {
            console.error('Error fetching employees:', err);
            res.status(500).json({ success: false, message: 'Error fetching employees' });
            return;
        }
        if (results.length > 0) {
            req.session.loggedin = true;
            req.session.username = username;
            res.redirect('/Dashboard');
        } else {
            res.status(500).json({ success: false, message: 'Wrong Credentials' });
        }
    });
});

// Handle Dashboard view
app.get('/Dashboard', (req, res) => {
    if (!req.session.loggedin) {
        res.redirect('/');
        return;
    }

    connection.query('SELECT * FROM employees', (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ error: 'Error fetching users' });
            return;
        }
        res.status(200).render('Dashboard', { Dashboard: results, username: req.session.username });
    });
});

// Handle logout
app.post('/api/logout', (req, res) => {
    req.session.loggedin = null;
    req.session.username = null;

    res.status(200).json({ success: true, message: 'Success' });
});

// Handle adding a new department
app.post('/api/adddepartments', (req, res) => {
    const { ID, Name } = req.body;

    connection.query("INSERT INTO departments (ID, Name) VALUES (?, ?)", [ID, Name], (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ success: false, message: 'Error fetching users' });
            return;
        }

        console.log('Received departments data:');
        console.log('ID:', ID);
        console.log('Name:', Name);

        res.status(200).send('Department added successfully!');
    });
});

// Handle adding a new user
app.post("/api/adduser", function (req, res) {
    var sql = "INSERT INTO employees (username, password, DepartmentID) VALUES (?, ?, ?)";
    connection.query(sql, [req.body.username, req.body.password, req.body.DepartmentID], function (err, result) {
        if (err) {
            console.error('Error adding user:', err);
            res.status(500).json({ success: false, error: 'Error adding user' });
        } else {
            console.log("1 record inserted");

            res.status(200).json({
                success: true,
                user: {
                    ID: result.insertId,
                    username: req.body.username,
                    DepartmentID: req.body.DepartmentID,
                    password: req.body.password
                }
            });
        }
    });
});

// Handle deleting a user
app.post("/api/delete", function (req, res) {
    var sql = "DELETE FROM employees WHERE ID = ?";
    connection.query(sql, [req.body.ID], function (err, result) {
        if (err) throw err;

        console.log("1 record deleted");

        // Decrease the ID counter by 1
        var updateSql = "ALTER TABLE employees AUTO_INCREMENT = " + (req.body.ID - 1);
        connection.query(updateSql, function (err, result) {
            if (err) throw err;
            console.log("ID counter decreased");
        });

        res.redirect("/");
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("http://localhost:3000");
});