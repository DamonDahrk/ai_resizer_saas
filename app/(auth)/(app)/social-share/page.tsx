"use client"

import React, {useEffect, useState, useRef} from 'react'
import { CldImage } from 'next-cloudinary';

const socialFormats = {
    "Instagram Square (1:1)": { width: 1080, height: 1080, aspectRatio: "1:1" },
    "Instagram Portrait (4:5)": { width: 1080, height: 1350, aspectRatio: "4:5" },
    "Twitter Post (16:9)": { width: 1200, height: 675, aspectRatio: "16:9" },
    "Twitter Header (3:1)": { width: 1500, height: 500, aspectRatio: "3:1" },
    "Facebook Cover (205:78)": { width: 820, height: 312, aspectRatio: "205:78" },
  };

  //all the possible social media formats


 type SocialFormat = keyof typeof socialFormats;

 //explicitly defining like typescript that only the keys are my socialFormats.


export default function SocialShare() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  //uploadedImage is a state variable that holds the URL of the uploaded image.
  //  It starts as null.
  const [selectedFormat, setSelectedFormat] = useState<SocialFormat>("Instagram Square (1:1)");
  //selectedFormat is a state variable that holds the selected social media format. 
  const [isTransforming, setIsTransforming] = useState(false);
  //This is checking if the image is being transformed or not. 
  const [isUploading, setIsUploading] = useState(false);
  //isUploading is a state variable that indicates whether an image is currently being uploaded. 
  const imageRef = useRef<HTMLImageElement>(null);
  //This is image reference that is used to access the image element in the DOM.


    useEffect(() => {
      if(uploadedImage){
          setIsTransforming(true);
          //if the image is uploaded, set isTransforming to true.
      
      }
    }, [selectedFormat, uploadedImage])
    //depends on selected Format and uploadedImage. 
    //If either of these changes, the effect will run again. 

     const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => { //React.ChangeEvent - This is a React-specific event type that wraps the native DOM

    // Extract the first file from the file input element
    // event.target.files is a FileList object containing selected files
   
    // This could be null/undefined if no file is selected
    const file = event.target.files?.[0];
    
    // Early return if no file is selected - prevents unnecessary processing
    if(!file) return;
    
    // Set loading state to true - typically used to show a loading spinner -> file detected now uploading
    
    setIsUploading(true);
    
    // Create a new FormData object - this is a web API for constructing 
   
    const formData = new FormData();
    
    // Append the file to FormData with the key "file"
    

    formData.append("file", file);

    try {
    
        // Using fetch API for making the network request
        const response = await fetch("/api/image-upload", {
            method: "POST",        // HTTP method for file upload
            body: formData         // Send FormData as request body
     
        })
    
        // If not successful
        if(!response.ok) throw new Error("Failed to upload image");

        // Parse the JSON response from the server
      
        const data = await response.json();
          
        // Cloudinary public ID or similar identifier
        // Used to display the uploaded image or reference it later
        setUploadedImage(data.publicId);

    } catch (error) {
        // Handle any errors that occurred during the upload process

        console.log(error)                    // debugging
        alert("Failed to upload image");     
        
    } finally{
        // This ensures UI returns to normal state (hide spinner, enable button)
        setIsUploading(false);
    }
};

//now download:

const handleDownload = () => {
  if(!imageRef.current) return;

  //interview 


  fetch(imageRef.current.src)
  //imageRef.current.src gets the source URL of an image 
  .then((response) => response.blob())
  //reads the entire response body and converts it to a Blob object
  //Blob is raw binary data
  .then((blob) => {
      const url = window.URL.createObjectURL(blob)
   //temporary URL that points to the blob in memory 
            const link = document.createElement("a");
            link.href = url;
  //Sets href to the blob URL created in the previous step
            link.download = `${selectedFormat
          .replace(/\s+/g, "_")
          .toLowerCase()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
//Adds the invisible link to the DOM 
//programmatically simulates clicking the download link
//Immediately removes the link from the DOM 
            window.URL.revokeObjectURL(url);
//revokeObjectURL() releases the blob URL from memory to free up
            document.body.removeChild(link);
  }) 

}


    return (
      
        <div className="container mx-auto p-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Social Media Image Creator
          </h1>

          <div className="card">
            <div className="card-body">
              <h2 className="card-title mb-4">Upload an Image</h2>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Choose an image file</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="file-input file-input-bordered file-input-primary w-full"
                />
              </div>

              {isUploading && (
                <div className="mt-4">
                  <progress className="progress progress-primary w-full"></progress>
                </div>
              )}

              {uploadedImage && (
                <div className="mt-6">
                  <h2 className="card-title mb-4">Select Social Media Format</h2>
                  <div className="form-control">
                    <select
                      className="select select-bordered w-full"
                      value={selectedFormat}
                      onChange={(e) =>
                        setSelectedFormat(e.target.value as SocialFormat)
                      }
                    >
                      {Object.keys(socialFormats).map((format) => ( //looping to show different social format options
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-6 relative">
                    <h3 className="text-lg font-semibold mb-2">Preview:</h3>
                    <div className="flex justify-center">
                      {isTransforming && (
                        <div className="absolute inset-0 flex items-center justify-center bg-base-100 bg-opacity-50 z-10">
                          <span className="loading loading-spinner loading-lg"></span>
                        </div>
                      )}
                      <CldImage //transforming things on the go
                        width={socialFormats[selectedFormat].width}
                        height={socialFormats[selectedFormat].height}
                        src={uploadedImage}
                        sizes="100vw"
                        alt="transformed image"
                        crop="fill"
                        aspectRatio={socialFormats[selectedFormat].aspectRatio}
                        gravity='auto' //dont forget
                        ref={imageRef} //logic is based on ref
                        onLoad={() => setIsTransforming(false)}
                        />
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-6">
                    <button className="btn btn-primary" onClick={handleDownload}>
                      Download for {selectedFormat}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
    );
}
