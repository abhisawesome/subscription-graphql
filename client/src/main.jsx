import { render } from "preact";
import { App } from "./app";
import "./index.css";
import {
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  ApolloClient,
  split,
} from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
// import { WebSocketLink } from "@apollo/client/link/ws";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";

import { createClient } from "graphql-ws";




const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
});


const wsLink = new GraphQLWsLink(

    createClient({
  
      url: "ws://localhost:4000/graphql",
  
    }),
  
  );
// const wsLink = new WebSocketLink({
//   uri: `ws://localhost:4000/graphql`,
//   options: {
//     reconnect: true,
//   },
// });


const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);

    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById("app")
);
