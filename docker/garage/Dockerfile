# Multi-stage: copy garage binary to alpine
FROM dxflrs/garage:v1.3.1 AS garage-bin

FROM alpine:3.21

# Install bash and curl for init script
RUN apk add --no-cache bash curl

# Copy garage binary from official image
COPY --from=garage-bin /garage /garage

# Copy configuration file
COPY garage.prod.toml /etc/garage.toml

# Copy auto-init script
COPY auto-init.sh /usr/local/bin/auto-init.sh
RUN chmod +x /usr/local/bin/auto-init.sh

# Copy startup wrapper
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/garage", "server"]
