from node:latest as build
workdir /app
copy client/package*.json ./
run npm install
copy client .
run npm run-script build

from nginx
workdir /usr/share/nginx/html
copy --from=build /app/dist/qr ./
copy nginx.conf /etc/nginx/nginx.conf
expose 80
#volume /var/log/nginx/log
cmd ["nginx", "-g", "daemon off;"]
