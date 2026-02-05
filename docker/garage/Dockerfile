FROM dxflrs/garage:v2.2.0

# Install bash and curl for init script
RUN apk add --no-cache bash curl

# Copy auto-init script
COPY auto-init.sh /usr/local/bin/auto-init.sh
RUN chmod +x /usr/local/bin/auto-init.sh

# Copy startup wrapper
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/garage", "server"]
