import { Box, Separator } from "@artsy/palette"
import { Collection_collection } from "__generated__/Collection_collection.graphql"
import { SeoProductsForArtworks } from "Apps/Collect2/Components/SeoProductsForArtworks"
import { CollectionFilterFragmentContainer as CollectionHeader } from "Apps/Collect2/Routes/Collection/Components/Header"
import { AppContainer } from "Apps/Components/AppContainer"
import { track } from "Artsy/Analytics"
import * as Schema from "Artsy/Analytics/Schema"
import { SystemContextProps, withSystemContext } from "Artsy/SystemContext"
import { FrameWithRecentlyViewed } from "Components/FrameWithRecentlyViewed"
import { RelatedCollectionsRailFragmentContainer as RelatedCollectionsRail } from "Components/RelatedCollectionsRail/RelatedCollectionsRail"
import { BreadCrumbList } from "Components/v2/Seo"
import { Match } from "found"
import { HttpError } from "found"
import React, { Component } from "react"
import { Link, Meta, Title } from "react-head"
import { createRefetchContainer, graphql, RelayRefetchProp } from "react-relay"
import { data as sd } from "sharify"
import truncate from "trunc-html"
import { CollectionsHubRailsContainer as CollectionsHubRails } from "./Components/CollectionsHubRails"

import { BaseArtworkFilter } from "Components/v2/ArtworkFilter"
import {
  ArtworkFilterContextProvider,
  SharedArtworkFilterContextProps,
} from "Components/v2/ArtworkFilter/ArtworkFilterContext"
import { updateUrl } from "Components/v2/ArtworkFilter/Utils/urlBuilder"
import { TrackingProp } from "react-tracking"

interface CollectionAppProps extends SystemContextProps {
  collection: Collection_collection
  match: Match
  relay: RelayRefetchProp
  tracking: TrackingProp
}

@track<CollectionAppProps>(props => ({
  context_module: Schema.ContextModule.CollectionDescription,
  context_page_owner_slug: props.collection && props.collection.slug,
  context_page_owner_id: props.collection && props.collection.slug,
}))
export class CollectionApp extends Component<CollectionAppProps> {
  collectionNotFound = collection => {
    if (!collection) {
      throw new HttpError(404)
    }
  }

  UNSAFE_componentWillMount() {
    this.collectionNotFound(this.props.collection)
  }

  render() {
    const {
      collection,
      match: { location },
      relay,
    } = this.props
    const {
      title,
      slug,
      headerImage,
      description,
      artworksConnection,
    } = collection
    const collectionHref = `${sd.APP_URL}/collection/${slug}`

    const metadataDescription = description
      ? `Buy, bid, and inquire on ${title} on Artsy. ` +
        truncate(description, 158).text
      : `Buy, bid, and inquire on ${title} on Artsy.`

    const showCollectionHubs = collection.linkedCollections.length > 0

    return (
      <AppContainer>
        <FrameWithRecentlyViewed>
          <Title>{`${title} - For Sale on Artsy`}</Title>
          <Meta name="description" content={metadataDescription} />
          <Meta property="og:url" content={collectionHref} />
          <Meta property="og:image" content={headerImage} />
          <Meta property="og:description" content={metadataDescription} />
          <Meta property="twitter:description" content={metadataDescription} />
          <Link rel="canonical" href={collectionHref} />
          <BreadCrumbList
            items={[
              { path: "/collections", name: "Collections" },
              { path: `/collection/${slug}`, name: title },
            ]}
          />
          {artworksConnection && (
            <SeoProductsForArtworks artworks={artworksConnection} />
          )}
          <CollectionHeader
            collection={collection}
            artworks={artworksConnection}
          />
          {showCollectionHubs && (
            <CollectionsHubRails
              linkedCollections={collection.linkedCollections}
            />
          )}
          <Box>
            <ArtworkFilterContextProvider
              filters={location.query}
              sortOptions={[
                { value: "-decayed_merch", text: "Default" },
                { value: "sold,-has_price,-prices", text: "Price (desc.)" },
                { value: "sold,-has_price,prices", text: "Price (asc.)" },
                { value: "-partner_updated_at", text: "Recently updated" },
                { value: "-published_at", text: "Recently added" },
                { value: "-year", text: "Artwork year (desc.)" },
                { value: "year", text: "Artwork year (asc.)" },
              ]}
              aggregations={
                artworksConnection.aggregations as SharedArtworkFilterContextProps["aggregations"]
              }
              onChange={updateUrl}
              onFilterClick={(key, value, filterState) => {
                this.props.tracking.trackEvent({
                  action_type: Schema.ActionType.CommercialFilterParamsChanged,
                  changed: { [key]: value },
                  current: filterState,
                })
              }}
            >
              <BaseArtworkFilter
                relay={relay}
                viewer={collection}
                relayVariables={{
                  slug: collection.slug,
                  first: 30,
                }}
              />
            </ArtworkFilterContextProvider>
          </Box>
          {collection.linkedCollections.length === 0 && (
            <>
              <Separator mt={6} mb={3} />
              <Box mt="3">
                <RelatedCollectionsRail
                  collections={collection.relatedCollections}
                  title={collection.title}
                />
              </Box>
            </>
          )}
        </FrameWithRecentlyViewed>
      </AppContainer>
    )
  }
}

// TODO: Add `@principalField` to below query
// when KAWS returns a 404 in `errors` for non-existent collections.
// Currently it doesn't send any errors so there isn't anything
// for Metaphysics to propagate.
export const CollectionAppQuery = graphql`
  query CollectionRefetch2Query(
    $acquireable: Boolean
    $aggregations: [ArtworkAggregation] = [
      MERCHANDISABLE_ARTISTS
      MEDIUM
      MAJOR_PERIOD
      TOTAL
    ]
    $atAuction: Boolean
    $color: String
    $forSale: Boolean
    $height: String
    $inquireableOnly: Boolean
    $majorPeriods: [String]
    $medium: String
    $offerable: Boolean
    $page: Int
    $priceRange: String
    $sort: String
    $slug: String!
    $width: String
  ) {
    collection: marketingCollection(slug: $slug) {
      ...Collection_collection
        @arguments(
          acquireable: $acquireable
          aggregations: $aggregations
          atAuction: $atAuction
          color: $color
          forSale: $forSale
          height: $height
          inquireableOnly: $inquireableOnly
          majorPeriods: $majorPeriods
          medium: $medium
          offerable: $offerable
          page: $page
          priceRange: $priceRange
          sort: $sort
          width: $width
          first: 30
        )
    }
  }
`

export const CollectionRefetchContainer = createRefetchContainer(
  withSystemContext(CollectionApp),
  {
    collection: graphql`
      fragment Collection_collection on MarketingCollection
        @argumentDefinitions(
          acquireable: { type: "Boolean" }
          aggregations: { type: "[ArtworkAggregation]" }
          atAuction: { type: "Boolean" }
          color: { type: "String" }
          forSale: { type: "Boolean" }
          height: { type: "String" }
          inquireableOnly: { type: "Boolean" }
          majorPeriods: { type: "[String]" }
          medium: { type: "String", defaultValue: "*" }
          offerable: { type: "Boolean" }
          page: { type: "Int" }
          priceRange: { type: "String" }
          sort: { type: "String", defaultValue: "-partner_updated_at" }
          width: { type: "String" }
          first: { type: "Int" }
        ) {
        ...Header_collection
        description
        headerImage
        slug
        title
        query {
          artist_id: artistID
          gene_id: geneID
        }
        relatedCollections {
          ...RelatedCollectionsRail_collections
        }
        linkedCollections {
          ...CollectionsHubRails_linkedCollections
        }
        artworksConnection(
          aggregations: $aggregations
          includeMediumFilterInAggregation: true
          size: 20
          first: 20
          sort: "-decayed_merch"
        ) {
          ...Header_artworks
          ...SeoProductsForArtworks_artworks
          aggregations {
            slice
            counts {
              value
              name
              count
            }
          }
        }
        filtered_artworks: artworksConnection(
          acquireable: $acquireable
          aggregations: $aggregations
          atAuction: $atAuction
          color: $color
          forSale: $forSale
          height: $height
          inquireableOnly: $inquireableOnly
          majorPeriods: $majorPeriods
          medium: $medium
          offerable: $offerable
          page: $page
          priceRange: $priceRange
          first: $first
          sort: $sort
          width: $width
        ) {
          id
          ...ArtworkFilterArtworkGrid2_filtered_artworks
        }
      }
    `,
  },
  CollectionAppQuery
)
