import User from '../models/User.js';
import { signToken, AuthenticationError } from '../services/auth.js';

interface User {
    _id: string;
    username: string;
    email: string;
    password: string;
    bookCount: number;
    savedBooks: Book[];
}

interface Book {
    bookId: string;
    authors: string[];
    description: string;
    title: string;
    image: string;
    link: string;
}

interface SaveBookArgs {
    bookData: Book;
}

interface RemoveBookArgs {
    bookId: string;
}

interface Context {
    user?: User;
}

const resolvers = {
    Query: {
      me: async (_parent: unknown, _args: unknown, context: Context): Promise<User | null> => {
        if (context.user) {
          return await User.findOne({ _id: context.user._id }).populate('savedBooks');
        }
        throw new AuthenticationError('You need to be logged in');
      },
    },
  
    Mutation: {
      login: async (_parent: unknown, { email, password }: { email: string; password: string }): Promise<{ token: string; user: User }> => {
        const user = await User.findOne({ $or: [{ username: email }, { email }] });
  
        if (!user) {
          throw new AuthenticationError('user not found');
        }
  
        const correctpassword = await user.isCorrectPassword(password);
        if (!correctpassword) {
          throw new AuthenticationError('Wrong password!');
        }
  
        const generateToken = (user: User) => signToken(user.username, user.email, user._id);
        const token = generateToken(user);
        return { token, user };
        
      },
  
      addUser: async (_parent: unknown, { username, email, password }: { username: string; email: string; password: string }): Promise<{ token: string; user: User }> => {
        const user = await User.create({ username, email, password });
        const token = signToken(user.username, user.email, user._id);
        return { token, user };
      },
      saveBook: async (_parent: unknown, { bookData }: SaveBookArgs, context: Context): Promise<User | null> => {
        if (context.user) {
          return await User.findOneAndUpdate(
            { _id: context.user._id },
            { $addToSet: { savedBooks: bookData } },
            { new: true, runValidators: true }
          );
        }
        throw new AuthenticationError('You need to be logged in');
      },
      removeBook: async (_parent: unknown, { bookId }: RemoveBookArgs, context: Context): Promise<User | null> => {
        if (context.user) {
          return await User.findOneAndUpdate(
            { _id: context.user._id },
            { $pull: { savedBooks: { bookId } } },
            { new: true }
          );
        }
        throw new AuthenticationError('You need to be logged in');
      },
    },
  };
  
  export default resolvers;
  