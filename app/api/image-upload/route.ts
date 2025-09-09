import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';

// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

interface CloudinaryUploadResult {
    public_id: string;
    [key: string]: any
}

export async function POST(request: NextRequest) {
    const {userId} = await auth()

    if (!userId) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }
    //user is not authorized

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        //here we are checking if the file is present or not

        if(!file){
            return NextResponse.json({error: "File not found"}, 
                {status: 400})
        }
        //if the file is not there then return file not found


        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        //bytes is a JavaScript ArrayBuffer holding the raw file data.

        //buffer is a Node.js Buffer object created from that ArrayBuffer.

        //This operation bridges web API binary data (ArrayBuffer) to Node.js Buffer
        //  API for more efficient binary data handling and manipulation.

        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    //Uplading to a folder in Cloudinary
                    {folder: "next-cloudinary-uploads"},
                    (error, result) => {
                        if(error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                    }
                    //If there's an error, the promise is rejected

                    //else the promise is resolved with
                    //  the result 


                )
                uploadStream.end(buffer)
                //after uploading the file we are ending the stream
            }
        )
        return NextResponse.json(
            {
                publicId: result.public_id
                //storing the public id of the uploaded file
            },
            {
                status: 200
            }
        )

    } catch (error) {
        console.log("UPload image failed", error)
        return NextResponse.json({error: "Upload image failed"}, {status: 500})
    }

}