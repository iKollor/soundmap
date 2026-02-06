FROM dxflrs/garage:v1.3.1

# Install bash and curl for init script
RUN apk add --no-cache bash curl

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
