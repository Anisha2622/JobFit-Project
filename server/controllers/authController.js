const User = require('../models/user'); // Corrected file path casing
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Controller function to register a user
exports.register = async (req, res) => {
    console.log('Register endpoint hit with body:', req.body);
    const { userType, companyName, jobId, password, fullName, email } = req.body;

    try {
        if (!userType || !password) {
            return res.status(400).json({ msg: 'User type and password are required.' });
        }
        if (userType === 'HR' && (!companyName || !jobId)) {
            return res.status(400).json({ msg: 'Company name and Job ID are required for HR.' });
        }
        if (userType === 'Candidate' && (!fullName || !email)) {
            return res.status(400).json({ msg: 'Full name and email are required for candidates.' });
        }

        let user;
        if (userType === 'HR') {
            user = await User.findOne({ jobId });
        } else {
            user = await User.findOne({ email });
        }

        if (user) {
            return res.status(400).json({ msg: 'User already exists.' });
        }

        const newUser = new User(req.body);

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);

        await newUser.save();
        console.log('New user saved to database:', newUser);

        const payload = {
            user: {
                id: newUser.id,
                userType: newUser.userType
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ token });
            }
        );

    } catch (error) {
        console.error('REGISTRATION ERROR:', error.message);
        res.status(500).send('Server Error');
    }
};

// Controller function to log in a user
exports.login = async (req, res) => {
    console.log('Login endpoint hit with body:', req.body);
    const { userType, jobId, email, password } = req.body;

    try {
        let user;
        const identifier = userType === 'HR' ? { jobId } : { email };
        user = await User.findOne(identifier);

        if (!user) {
            console.log('Login failed: User not found.');
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Login failed: Password does not match.');
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        const payload = {
            user: {
                id: user.id,
                userType: user.userType
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                console.log('Login successful, token generated.');
                res.json({ token });
            }
        );

    } catch (error) {
        console.error('LOGIN ERROR:', error.message);
        res.status(500).send('Server Error');
    }
};

