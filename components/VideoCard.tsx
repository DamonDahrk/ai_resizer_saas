import React, {useState, useEffect, useCallback} from 'react'
import { getCldVideoUrl, getCldImageUrl } from 'next-cloudinary'
import dayjs from 'dayjs';
import relativeTime  from 'dayjs/plugin/relativeTime';
import {filesize} from "filesize"
import {Video} from '@prisma/client';
import { Download, Clock, FileDown, FileUp } from "lucide-react";

dayjs.extend(relativeTime)

interface VideoCardProps {
    video: Video;
    onDownload: (url: string, title: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({video, onDownload}) => {
//React.FC means react functional component 

    const [isHovered, setIsHovered] = useState(false)
    const [previewError, setPreviewError] = useState(false)

    //While we can get thumbnail URL from the Video object we 
    //are making a callback fnc that will run once so that
    //we can use the thumnailurl later if we want to


    const getThumbnailUrl = useCallback((publicId: string)=> {
        //below is a hook that goes into cloudinary that comes back 
        //with data
        //we should get thumbnail details on the below:

        return getCldImageUrl({
            src: publicId,
            width: 400,
            height: 225,
            crop: "fill",
            gravity: "auto",
            format: "jpg",
            quality: "auto",
            assetType: "video"
        })
    },[])

     const getFullVideoUrl = useCallback((publicId: string)=> {
   
        return getCldVideoUrl({
            //full video here
            src: publicId,
            width: 1920,
            height: 1080,
        })
    },[])

     const getPreviewVideoUrl = useCallback((publicId: string)=> {
        
        return getCldVideoUrl({
            //full video here
            src: publicId,
            width: 400,
            height: 225,
            rawTransformations: ["e_preview:duration_15:max_seg_9:min_seg_dur_1"]
        // above is the transformation that we want to apply to the video
        
        })
    },[])

    const formatSize = useCallback((size: number)=>{
        return filesize(size)
    }, [])

    //here we are using the existing filesize js to get the readable
    //string for size of the image or video from cloudinary

    const formatDuration = useCallback((seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        //Gets the remaining seconds and rounds to nearest whole number
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
      }, []);

      //padStart is Js method that pads the beginning zeros 
      // 7 -> 07 

      const compressionPercentage = Math.round(
        (1 - Number(video.compressedSize) / Number(video.originalSize)) * 100
      );

      //get the reduction ratio from the above

      useEffect(() => {
        setPreviewError(false);
      }, [isHovered]);
      //will chang on Hover to show preview

      const handlePreviewError = () => {
        setPreviewError(true);
      };


  return (
    <div
          className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          //on mouse hovering we are changing states
        >
          <figure className="aspect-video relative">
            {isHovered ? (
              previewError ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <p className="text-red-500">Preview not available</p>
                </div>
              ) : (
                <video  //on hover show preview
                  src={getPreviewVideoUrl(video.publicId)}
                  autoPlay //most imp part
                  muted  //preview is muted
                  loop  //it is on  a loop
                  className="w-full h-full object-cover"
                  onError={handlePreviewError}
                />
              )
            ) : (
              <img //someone doesnt hover then show this instead
                src={getThumbnailUrl(video.publicId)}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute bottom-2 right-2 bg-base-100 bg-opacity-70 px-2 py-1 rounded-lg text-sm flex items-center">
              <Clock size={16} className="mr-1" />
              {formatDuration(video.duration)}
            </div>
          </figure>
          <div className="card-body p-4">
            <h2 className="card-title text-lg font-bold">{video.title}</h2>
            <p className="text-sm text-base-content opacity-70 mb-4">
              {video.description}
            </p>
            <p className="text-sm text-base-content opacity-70 mb-4">
              Uploaded {dayjs(video.createdAt).fromNow()}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <FileUp size={18} className="mr-2 text-primary" />
                <div>
                  <div className="font-semibold">Original</div>
                  <div>{formatSize(Number(video.originalSize))}</div>
                </div>
              </div>
              <div className="flex items-center">
                <FileDown size={18} className="mr-2 text-secondary" />
                <div>
                  <div className="font-semibold">Compressed</div>
                  <div>{formatSize(Number(video.compressedSize))}</div>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm font-semibold">
                Compression:{" "}
                <span className="text-accent">{compressionPercentage}%</span>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() =>
                  onDownload(getFullVideoUrl(video.publicId), video.title)
                }
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>
  )
}

export default VideoCard
