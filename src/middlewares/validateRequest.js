
import { validationResult } from 'express-validator';

const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result
    .array({ onlyFirstError: true })
    .map(({ path, location, msg }) => ({
      field: path,
      location,
      message: msg,
    }));

  return res.status(422).json({
    success: false,
    message: 'Request validation failed.',
    errors,
  });
};

export default validateRequest;
