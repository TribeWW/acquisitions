import logger from "#config/logger.js";
import { signUpSchema } from "#validations/auth.validation.js";
import { formatValidationError } from "#utils/format.js";
import { createUser } from "#services/auth.service.js";
import { jwttoken } from "#utils/jwt.js";
import { cookies } from "#utils/cookies.js";

export const signUp = async (req, res, next) => {
  try {
    const validationResult = signUpSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }
    const { name, email, password, role } = validationResult.data;
    //AUTH SERVICE
    const user = await createUser({ name, email, password, role });
    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    cookies.set(res, "token", token);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.info(`User registered successfully: {error}`);
    if (error.message === "User with this email already exists") {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }
    next(error);
  }
};
