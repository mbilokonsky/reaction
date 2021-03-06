import { ArtistHeader_Test_QueryRawResponse } from "__generated__/ArtistHeader_Test_Query.graphql"
import { ArtistHeaderFixture } from "Apps/__tests__/Fixtures/Artist/Components/ArtistHeader"
import { ArtistHeaderFragmentContainer as ArtistHeader } from "Apps/Artist/Components/ArtistHeader"
import { renderRelayTree } from "DevTools"
import { graphql } from "react-relay"

jest.unmock("react-relay")

describe("ArtistHeader", () => {
  const getWrapper = async (
    response: ArtistHeader_Test_QueryRawResponse["artist"] = ArtistHeaderFixture
  ) => {
    return await renderRelayTree({
      Component: ArtistHeader,
      query: graphql`
        query ArtistHeader_Test_Query @raw_response_type {
          artist(id: "pablo-picasso") {
            ...ArtistHeader_artist
          }
        }
      `,
      mockData: {
        artist: response,
      } as ArtistHeader_Test_QueryRawResponse,
    })
  }

  it("renders correct information about the artist", async () => {
    const wrapper = await getWrapper()
    const html = wrapper.html()
    expect(html).toContain("British")
    expect(html).toContain("born 1969")
    expect(html).toContain("9,135 followers")
  })

  it("renders the follow button in the correct state", async () => {
    const wrapper = await getWrapper()
    const html = wrapper.html()
    expect(html).toContain(">Following<")
    expect(html).not.toContain(">Follow<")
  })
})
