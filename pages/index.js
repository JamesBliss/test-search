import React from "react";
import { InstantSearch, Configure } from "react-instantsearch-dom";
import algoliasearch from "algoliasearch/lite";
import { findResultsState } from "react-instantsearch-dom/server";
import qs from "qs";

const pathToSearchState = (path) =>
  path.includes("?") ? qs.parse(path.substring(path.indexOf("?") + 1)) : {};

const createURL = (state) => `?${qs.stringify(state)}`;

const searchClientSSR = algoliasearch(
  process.env.ALGOLIA_APPLICATION_ID,
  process.env.ALGOLIA_SEARCH_API_KEY
);

const indexName = `dev.uk.EN.products`;

function dehydrateMetadata(resultsState) {
  if (!resultsState) {
    return [];
  }

  // add a value noop, which gets replaced once the widgets are mounted
  return resultsState.metadata.map((datum) => ({
    ...datum,
    value: undefined,
    items:
      datum.items &&
      datum.items.map((item) => ({
        ...item,
        value: undefined,
        items:
          item.items &&
          item.items.map((nestedItem) => ({
            ...nestedItem,
            value: undefined
          }))
      }))
  }));
}

function dehydrateState(resultsState) {
  if (!resultsState) {
    return {};
  }

  return JSON.parse(JSON.stringify(resultsState.state));
}

const Search = ({
  searchClient = searchClientSSR,
  resultsState,
  searchState,
  ...rest
}) => (
  <InstantSearch
    searchClient={searchClient}
    resultsState={resultsState}
    onSearchStateChange={(props) => console.log(props)}
    searchState={searchState}
    createURL={createURL}
    indexName={indexName}
    {...rest}
  >
    <Configure hitsPerPage={12} />
    hello o
  </InstantSearch>
);

export const getServerSideProps = async (context) => {
  const searchState = pathToSearchState(context.resolvedUrl);

  const resultsState = await findResultsState(Search, {
    searchClient: searchClientSSR,
    indexName,
    searchState
  });

  return {
    props: {
      resultsState: {
        ...resultsState,
        metadata: dehydrateMetadata(resultsState),
        state: dehydrateState(resultsState)
      },
      searchState,
      indexName
    }
  };
};

export default Search;
