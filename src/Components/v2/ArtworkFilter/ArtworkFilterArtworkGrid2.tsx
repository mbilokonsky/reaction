import { Box, Spacer } from "@artsy/palette"
import { isEmpty } from "lodash"
import React, { useEffect } from "react"
import { createFragmentContainer, graphql, RelayProp } from "react-relay"

import { ArtworkFilterArtworkGrid2_filtered_artworks } from "__generated__/ArtworkFilterArtworkGrid2_filtered_artworks.graphql"
import { useSystemContext } from "Artsy"
import ArtworkGrid from "Components/ArtworkGrid"
import { get } from "Utils/get"
import { LoadingArea } from "../LoadingArea"
import { PaginationFragmentContainer as Pagination } from "../Pagination"
import { Aggregations, useArtworkFilterContext } from "./ArtworkFilterContext"

interface ArtworkFilterArtworkGridProps {
  columnCount: number[]
  filtered_artworks: ArtworkFilterArtworkGrid2_filtered_artworks
  isLoading?: boolean
  relay: RelayProp
}

const ArtworkFilterArtworkGrid: React.FC<
  ArtworkFilterArtworkGridProps
> = props => {
  const { user, mediator } = useSystemContext()
  const context = useArtworkFilterContext()
  const aggregations = get(props, p => p.filtered_artworks.aggregations)

  /**
   * If aggregations have not been passed as props when instantiating the
   * <ArtworkFilter> component then populate.
   */
  useEffect(() => {
    if (isEmpty(context.aggregations) && aggregations.length) {
      context.setAggregations(aggregations as Aggregations)
    }
  }, [])

  const {
    columnCount,
    filtered_artworks: {
      pageCursors,
      pageInfo: { hasNextPage },
    },
  } = props

  /**
   * Load next page of artworks
   */
  function loadNext() {
    if (hasNextPage) {
      loadPage(context.filters.page + 1)
    }
  }

  /**
   * Refetch page of artworks based on cursor
   */
  function loadPage(page) {
    context.setFilter("page", page)
  }

  return (
    <>
      <LoadingArea isLoading={props.isLoading}>
        <ArtworkGrid
          artworks={props.filtered_artworks}
          columnCount={columnCount}
          preloadImageCount={9}
          itemMargin={40}
          user={user}
          mediator={mediator}
          onClearFilters={context.resetFilters}
          emptyStateComponent={context.ZeroState && <context.ZeroState />}
          onBrickClick={artwork => {
            if (context.onArtworkBrickClick) {
              context.onArtworkBrickClick(artwork, props)
            }
          }}
        />

        <Spacer mb={3} />

        <Box>
          <Pagination
            hasNextPage={hasNextPage}
            pageCursors={pageCursors}
            onClick={(_cursor, page) => loadPage(page)}
            onNext={() => loadNext()}
            scrollTo="#jump--artworkFilter"
          />
        </Box>
      </LoadingArea>
    </>
  )
}

export const ArtworkFilterArtworkGridRefetchContainer = createFragmentContainer(
  ArtworkFilterArtworkGrid,
  {
    filtered_artworks: graphql`
      fragment ArtworkFilterArtworkGrid2_filtered_artworks on FilterArtworksConnection {
        id
        aggregations {
          slice
          counts {
            value
            name
            count
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        pageCursors {
          ...Pagination_pageCursors
        }
        edges {
          node {
            id
          }
        }
        ...ArtworkGrid_artworks
      }
    `,
  }
)
