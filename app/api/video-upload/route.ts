import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});

const prisma = new PrismaClient()

interface CloudinaryUploadResult {
    public_id: string;
    bytes: number;
    duration?: number;
    [key: string]: any
}

export async function POST(request: NextRequest) {
    const {userId} = await auth()

    if (!userId) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }
    //user is not authorized

    if(
        !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
    ){
        return NextResponse.json({error: "Missing cloudinary credentials"}, 
            {status: 500})
    }
    //if the credentials are not present then return missing credentials

    

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string | null;
        const originalSize = formData.get("originalSize") as string;

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
                    {
                        resource_type: "video",
                        folder: "video-uploads",
                        transformation: [{quality: "auto",
                            fetch_format: "mp4"
                        }]
                    },
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
         const video = await prisma.video.create({
            data: {
                title,
                description,
                publicId: result.public_id,
                originalSize: originalSize,
                compressedSize: String(result.bytes),
                duration: result.duration || 0,
            }
        })
        
      return NextResponse.json(video)
      //return the video

    } catch (error) {
        console.log("UPload image failed", error)
        return NextResponse.json({error: "Upload image failed"}, {status: 500})
    }finally{
        await prisma.$disconnect()
    }

}