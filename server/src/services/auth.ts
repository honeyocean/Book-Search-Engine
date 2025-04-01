import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { GraphQLError } from 'graphql';

dotenv.config();

interface JwtPayload {
  _id: unknown;
  username: string;
  email: string,
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
 let token = req.body.token || req.query.token || req.headers.authorization;

 if(req.headers.authorization){
  token = token.split(' ').pop().trim();
 }

 if(!token){
  return next();
 }

 try{
  const{data}: any = jwt.verify(token,process.env.JWT_SECRET_KEY || '', {maxAge: '2hr'});
  req.user = data;
 }catch(error){
  console.log('Invalid token', error);
  return res.status(401).json({message: 'Invalid token'});
 }
 return next();
};

export const signToken = (username: string, email: string, _id: unknown) => {
  const payload = { username, email, _id };
  const secretKey = process.env.JWT_SECRET_KEY || '';

  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};


export class AuthenticationError extends GraphQLError{
  constructor(message:string){
    super(message,undefined, ['Unauthenticated']);
    Object.defineProperty(this,'name',{value:'AuthencationError'});
  };
};
