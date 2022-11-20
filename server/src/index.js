import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServer } from "@apollo/server";
import express from "express";
import { PubSub } from "graphql-subscriptions";
import { WebSocketServer } from "ws";
import { createServer } from "node:http";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

let PORT = 4000;


let currentNumber = 10;


(async () => {
  const pubsub = new PubSub();

  const typeDefs = `#graphql
type Query {
  currentNumber: Int
}

type Mutation{
    incrementNumber: Int
}
type Subscription {
    numberIncremented: Int
}
`;

  const resolvers = {
    Query: {
      currentNumber() {
        return currentNumber;
      },
    },
    Mutation: {
      incrementNumber(root, args) {
        currentNumber = currentNumber + 1;
        pubsub.publish("NUMBER_INCREMENTED", {
          numberIncremented: currentNumber,
        });
        return currentNumber;
      },
    },
    Subscription: {
      numberIncremented: {
        subscribe: () => {
          return pubsub.asyncIterator(["NUMBER_INCREMENTED"]);
        },
      },
    },
  };

  const app = express();

  const httpServer = createServer(app);
  /**
   * Websocket server
   */
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const serverCleanup = useServer({ schema }, wsServer);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });
  await server.start();

  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(server, {
      context: ({ req, res }) => {
        return {
          req
        };
      },
    })
  );

  httpServer.listen(PORT, () => {
    console.log(`🚀 Query endpoint ready at http://localhost:${PORT}/graphql`);
    console.log(
      `🚀 Subscription endpoint ready at ws://localhost:${PORT}/graphql`
    );
  });
  //   app.listen(PORT, () => {
  //     console.log(`🚀 Query endpoint ready at http://localhost:${PORT}/graphql`);
  //   });
})();
