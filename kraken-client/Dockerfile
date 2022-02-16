FROM nginx:alpine

# Add open ssl
RUN apk update && apk add openssl

RUN mkdir -p /etc/nginx/ssl/ \
    && openssl req \
            -x509 \
            -subj "/C=CA/ST=Denial/L=Nowhere/O=Dis" \
            -nodes \
            -days 365 \
            -newkey rsa:2048 \
            -keyout /etc/nginx/ssl/nginx.key \
            -out /etc/nginx/ssl/nginx.cert

# Add nginx
ADD ./config/nginx.conf /etc/nginx/nginx.conf

# Set working directory to nginx asset directory
WORKDIR /usr/share/nginx/html

COPY ./build .

# Entry point when Docker container has started
ENTRYPOINT ["nginx", "-g", "daemon off;"]