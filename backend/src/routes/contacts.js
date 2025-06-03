const express = require('express');
const { query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/contacts/enrich
 * @desc Get enriched contact information for an email address
 * @access Protected (JWT required)
 */
router.get('/enrich', 
  authenticateToken,
  [
    query('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email } = req.query;
      const db = req.app.locals.db;

      console.log(`🔍 Contact enrichment requested for: ${email} by user: ${req.user.email}`);

      const contactQuery = `
        SELECT 
          email,
          full_name,
          department,
          phone_number,
          job_title,
          company,
          location,
          created_at,
          updated_at
        FROM contacts 
        WHERE email = $1
      `;

      const contactResult = await db.query(contactQuery, [email]);

      if (contactResult.rows.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            email: email,
            enriched: false,
            message: 'No additional contact information available for this email address',
            suggestions: [
              'This contact may be new to the system',
              'Contact information might be added in the future',
              'Try searching with a different email address'
            ]
          },
          requestedBy: req.user.email,
          timestamp: new Date().toISOString()
        });
      }

      const contact = contactResult.rows[0];

      res.status(200).json({
        success: true,
        data: {
          email: contact.email,
          enriched: true,
          contactInfo: {
            fullName: contact.full_name,
            department: contact.department,
            phoneNumber: contact.phone_number,
            jobTitle: contact.job_title,
            company: contact.company,
            location: contact.location
          },
          metadata: {
            dataAge: Math.floor((new Date() - new Date(contact.updated_at)) / (1000 * 60 * 60 * 24)), // days
            lastUpdated: contact.updated_at,
            dataSource: 'Internal Database'
          }
        },
        requestedBy: req.user.email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Contact enrichment error:', error);
      res.status(500).json({
        error: 'Internal server error during contact enrichment',
        message: 'Please try again later'
      });
    }
  }
);

/**
 * @route GET /api/contacts/search
 * @desc Search contacts by name, department, or job title
 * @access Protected (JWT required)
 */
router.get('/search',
  authenticateToken,
  [
    query('q')
      .isLength({ min: 2 })
      .withMessage('Search query must be at least 2 characters long')
      .trim()
      .escape()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { q } = req.query;
      const db = req.app.locals.db;

      console.log(`🔍 Contact search requested for: "${q}" by user: ${req.user.email}`);

      const searchQuery = `
        SELECT 
          email,
          full_name,
          department,
          phone_number,
          job_title,
          company,
          location
        FROM contacts 
        WHERE 
          full_name ILIKE $1 OR
          department ILIKE $1 OR
          job_title ILIKE $1 OR
          company ILIKE $1
        ORDER BY 
          CASE 
            WHEN full_name ILIKE $2 THEN 1
            WHEN job_title ILIKE $2 THEN 2
            WHEN department ILIKE $2 THEN 3
            ELSE 4
          END,
          full_name
        LIMIT 20
      `;

      const searchPattern = `%${q}%`;
      const exactPattern = `${q}%`;

      const searchResult = await db.query(searchQuery, [searchPattern, exactPattern]);

      res.status(200).json({
        success: true,
        query: q,
        results: searchResult.rows.map(contact => ({
          email: contact.email,
          fullName: contact.full_name,
          department: contact.department,
          phoneNumber: contact.phone_number,
          jobTitle: contact.job_title,
          company: contact.company,
          location: contact.location
        })),
        totalFound: searchResult.rows.length,
        requestedBy: req.user.email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Contact search error:', error);
      res.status(500).json({
        error: 'Internal server error during contact search',
        message: 'Please try again later'
      });
    }
  }
);

/**
 * @route GET /api/contacts/directory
 * @desc Get company directory (all contacts)
 * @access Protected (JWT required)
 */
router.get('/directory',
  authenticateToken,
  async (req, res) => {
    try {
      const db = req.app.locals.db;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      console.log(`📁 Directory access requested by user: ${req.user.email} (page ${page})`);

      const countQuery = 'SELECT COUNT(*) as total FROM contacts';
      const countResult = await db.query(countQuery);
      const totalContacts = parseInt(countResult.rows[0].total);

      const directoryQuery = `
        SELECT 
          email,
          full_name,
          department,
          phone_number,
          job_title,
          company,
          location
        FROM contacts 
        ORDER BY full_name
        LIMIT $1 OFFSET $2
      `;

      const directoryResult = await db.query(directoryQuery, [limit, offset]);

      const contactsByDepartment = directoryResult.rows.reduce((acc, contact) => {
        const dept = contact.department || 'Unknown';
        if (!acc[dept]) {
          acc[dept] = [];
        }
        acc[dept].push({
          email: contact.email,
          fullName: contact.full_name,
          phoneNumber: contact.phone_number,
          jobTitle: contact.job_title,
          company: contact.company,
          location: contact.location
        });
        return acc;
      }, {});

      res.status(200).json({
        success: true,
        data: {
          contacts: directoryResult.rows.map(contact => ({
            email: contact.email,
            fullName: contact.full_name,
            department: contact.department,
            phoneNumber: contact.phone_number,
            jobTitle: contact.job_title,
            company: contact.company,
            location: contact.location
          })),
          contactsByDepartment
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalContacts / limit),
          totalContacts,
          limit,
          hasNext: page * limit < totalContacts,
          hasPrev: page > 1
        },
        requestedBy: req.user.email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Directory access error:', error);
      res.status(500).json({
        error: 'Internal server error during directory access',
        message: 'Please try again later'
      });
    }
  }
);

/**
 * @route GET /api/contacts/stats
 * @desc Get contact database statistics
 * @access Protected (JWT required)
 */
router.get('/stats',
  authenticateToken,
  async (req, res) => {
    try {
      const db = req.app.locals.db;

      console.log(`📊 Stats requested by user: ${req.user.email}`);

      const statsQueries = [
        { name: 'totalContacts', query: 'SELECT COUNT(*) as count FROM contacts' },
        { name: 'departmentCount', query: 'SELECT COUNT(DISTINCT department) as count FROM contacts WHERE department IS NOT NULL' },
        { name: 'companyCount', query: 'SELECT COUNT(DISTINCT company) as count FROM contacts WHERE company IS NOT NULL' },
        { name: 'contactsWithPhone', query: 'SELECT COUNT(*) as count FROM contacts WHERE phone_number IS NOT NULL' }
      ];

      const statsPromises = statsQueries.map(stat => 
        db.query(stat.query).then(result => ({ [stat.name]: parseInt(result.rows[0].count) }))
      );

      const statsResults = await Promise.all(statsPromises);
      const stats = Object.assign({}, ...statsResults);

      const deptQuery = `
        SELECT department, COUNT(*) as count 
        FROM contacts 
        WHERE department IS NOT NULL 
        GROUP BY department 
        ORDER BY count DESC
      `;
      const deptResult = await db.query(deptQuery);

      res.status(200).json({
        success: true,
        statistics: {
          ...stats,
          departmentBreakdown: deptResult.rows.map(row => ({
            department: row.department,
            contactCount: parseInt(row.count)
          }))
        },
        requestedBy: req.user.email,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({
        error: 'Internal server error during stats retrieval',
        message: 'Please try again later'
      });
    }
  }
);

module.exports = router; 