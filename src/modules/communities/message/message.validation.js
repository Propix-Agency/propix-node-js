
import { body, checkExact } from 'express-validator';

export const registerUserValidation = [
  body('email')
    .isString()
    .withMessage('Email must be a string.')
    .bail()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please provide a valid email address.'),

  body('firstName')
    .optional()
    .isString()
    .withMessage('First name must be a string.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('First name must be between 1 and 80 characters.'),

  body('lastName')
    .optional()
    .isString()
    .withMessage('Last name must be a string.')
    .bail()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage('Last name must be between 1 and 80 characters.'),

  body('phone')
    .optional()
    .isString()
    .withMessage('Phone number must be a string.')
    .bail()
    .trim()
    .matches(/^\+?[0-9\s().-]+$/)
    .withMessage('Please provide a valid phone number.')
    .bail()
    .isLength({ min: 5, max: 32 })
    .withMessage('Phone number length is invalid.'),

  checkExact(
    [
      body('email'),
      body('firstName'),
      body('lastName'),
      body('phone'),
    ],
    {
      locations: ['body'],
    },
  ),
];
