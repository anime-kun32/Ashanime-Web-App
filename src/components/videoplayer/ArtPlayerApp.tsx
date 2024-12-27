import React, { useEffect, useState } from "react";
import Artplayer from "./ArtPlayer";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import MoonLoader from "react-spinners/MoonLoader";
import axios from "axios";
import {
  setStreamEpisodeLinkObject,
  setVideoLink,
} from "../../redux/videoState-slice";

interface props {
  animeStatus?: string;
}

const ArtPlayer = (props: props) => {
  const [loading, setLoading] = useState(false);
  const [episodeObject, setEpisodeObject] = useState({
    intro: {
      start: 0,
      end: 0,
    },
    sources: [],
    subtitles: [],
  });

  const dispatch = useDispatch();

  const videoLink = useSelector(
    (state: RootState) => state.videoState.videoLink
  );
  const streamEpisode = useSelector(
    (state: RootState) => state.anime.streamEpisode
  );
  const provider = useSelector(
    (state: RootState) => state.videoState.streamProvider
  );

  
const getEpisodeStream = async () => {
  setLoading(true);
  try {
    const response = await axios.get(
      `https://anime-kun32.vercel.app/meta/anilist/watch/${streamEpisode.id}`,
      {
        params: {
          ...(provider && { provider }),
        },
      }
    );

    const data = response.data;

    // Modify the sources to use the proxy
    const proxiedSources = data.sources.map((source: any) => ({
      ...source,
      url: `https://gogoanime-and-hianime-proxy.vercel.app/hls-proxy?url=${encodeURIComponent(source.url)}`,
    }));

    // Update the episode object with proxied sources
    const updatedData = {
      ...data,
      sources: proxiedSources,
    };

    setEpisodeObject(updatedData); // Update local state
    dispatch(setStreamEpisodeLinkObject(updatedData)); // Update Redux state
    dispatch(setVideoLink(proxiedSources[0].url)); // Set the video link
  } catch (error: any) {
    console.error("Error fetching episode stream:", error.response || error);
  } finally {
    setLoading(false); // Ensure loading state is updated
  }
};

  useEffect(() => {
    const getData = async () => {
      await getEpisodeStream();
    };
    if (typeof streamEpisode.id === "string" && streamEpisode.id.length > 0) {
      getData();
    }
    handleSubtitles();
  }, [streamEpisode, provider]);

  useEffect(() => {
    return () => {
      dispatch(setVideoLink(""));
    };
  }, []);

  // const handleVideoLink = (quality: string) => {
  //   episodeObject.sources.forEach((source: any) => {
  //     if (source.quality === quality) {
  //       dispatch(setVideoLink(source.url));
  //       return source.url;
  //     }
  //   });
  // };

  const handleSubtitles = () => {
    if (episodeObject.subtitles) {
      return episodeObject.subtitles.map((subtitle: any) => {
        return {
          html: subtitle.lang,
          url: subtitle.url,
        };
      });
    }
  };

  return (
    <div className="relative flex justify-center items-end w-full lg:h-full md:h-[21rem]  bg-black">
      {loading ? (
        <div className="flex justify-center items-center w-full h-full">
          <div className="sweet-loading">
            <MoonLoader color={"white"} loading={loading} size={60} />
          </div>
        </div>
      ) : (
        (!videoLink && (
          <div className="flex justify-center items-center w-full h-full">
            <span className="text-white outfit-medium flex justify-start items-center h-full ">
              {/*if no video URL then display below message and if animeStatus is upcoming say that it is upcoming */}
              {props.animeStatus === "Upcoming"
                ? "This anime is yet to be released."
                : "Select an episode to watch!"}
            </span>
          </div>
        )) || (
          <div className="w-full h-full">
            <Artplayer />
          </div>
        )
      )}
    </div>
  );
};

export default ArtPlayer;
