import { mount } from "enzyme"
import React from "react"
import { act } from "react-dom/test-utils"
import {
  ArtworkFilterContextProps,
  ArtworkFilterContextProvider,
  useArtworkFilterContext,
} from "../../ArtworkFilterContext"
import { PriceRangeFilter } from "../PriceRangeFilter"

describe("PriceRangeFilter", () => {
  let context: ArtworkFilterContextProps

  const getWrapper = () => {
    return mount(
      <ArtworkFilterContextProvider>
        <PriceRangeFilterTest />
      </ArtworkFilterContextProvider>
    )
  }

  const PriceRangeFilterTest = () => {
    context = useArtworkFilterContext()
    return <PriceRangeFilter />
  }

  it("updates context on filter change", done => {
    const wrapper = getWrapper() as any
    act(() => {
      wrapper
        .find("PriceRange")
        .instance()
        .props.onAfterChange([20, 100])

      setTimeout(() => {
        expect(context.filters.priceRange).toEqual("20-100")
        done()
      }, 0)
    })
  })
})
