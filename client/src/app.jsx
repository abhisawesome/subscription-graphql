import { useEffect, useState } from "preact/hooks";
import { useSubscription, gql, useQuery } from "@apollo/client";
import "./app.css";

const subscription = gql(
  `subscription {
    numberIncremented
  }`
);
const query = gql(`
  query {
    currentNumber
  }`);

export function App() {
  const [count, setCount] = useState(0);
  // subscription
  const { loading, error, data } = useSubscription(subscription);
  // query
  const {
    loading: queryLoading,
    error: queryError,
    data: queryData,
  } = useQuery(query);

  useEffect(() => {
    if (data && data.numberIncremented) {
      setCount(data.numberIncremented);
    }
  }, [data]);
  useEffect(() => {
    if (queryData && queryData.currentNumber) {
      setCount(queryData.currentNumber);
    }
  }, [queryData]);
  if (queryLoading) {
    return (
      <>
        <div>Loading...</div>
      </>
    );
  }
  return (
    <>
      <div class="card">current number is {count}</div>
    </>
  );
}
