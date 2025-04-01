import express from 'express';
import path from 'node:path';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';
import { authenticateToken } from './services/auth.js';
import db from './config/connection.js';
import { Request, Response } from 'express';

const __dirname = path.resolve();

const createApolloServer = () => new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production', 
});

const configureApp = (app: express.Express) => {
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use('/graphql', expressMiddleware(server, { context: ({ req }: { req: Request }) => ({ user: req.user || null }) }));
};

const serveStaticAssets = (app: express.Express) => {
    if (process.env.NODE_ENV === 'production') {
        const clientDistPath = path.join(__dirname, '../client/dist');
        app.use(express.static(clientDistPath));
        app.get('*', (_req: Request, res: Response) => {
            res.sendFile(path.join(clientDistPath, 'index.html'));
        });
    }
};

const startApolloServer = async () => {
    const server = createApolloServer();  
    await server.start();
    await db();  

    const app = express();
    const PORT = process.env.PORT || 3001;

    configureApp(app);  

    serveStaticAssets(app); 

    app.listen(PORT, () => {
        console.log(`API server running on port ${PORT}`);
        console.log(`GraphQL server ready at http://localhost:${PORT}/graphql`);
    });
};

startApolloServer();
