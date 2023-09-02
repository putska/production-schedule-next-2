/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production'
const url = 'http://wwweb/portal/reactmodules/productionschedulenext/'; 

const nextConfig = {
  assetPrefix: isProd ? url : undefined,
  output: 'export',
  // output: 'standalone',
  distDir: 'build',
  images: { unoptimized: true }
  // async redirects() {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/production-schedule',
  //       permanent: true,
  //     },
  //   ]
  // },
  // async headers() {
  //   return [
  //       {
  //           // matching all API routes
  //           source: "/wwweb/portal/desktopmodules/ww_Global/API/PSDev/:path*",
  //           headers: [
  //               { key: "Access-Control-Allow-Credentials", value: "true" },
  //               { key: "Access-Control-Allow-Origin", value: "http://localhost:3000" }, // replace this your actual origin
  //               { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
  //               { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
  //           ]
  //       }
  //   ]
// }

}

module.exports = nextConfig
