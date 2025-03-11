{
  description = "aurabloom dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        devPkgs = with pkgs; [
          bun
          nodejs
          minio
          netcat
        ];

        serviceUtils = pkgs.writeScriptBin "service-utils" ''
          #!${pkgs.bash}/bin/bash

          checkPort() {
            ${pkgs.netcat}/bin/nc -z localhost $1 2>/dev/null
          }

          findFreePort() {
            local port=$1
            while checkPort $port; do
              port=$((port + 2))
            done
            echo $port
          }

          startService() {
            local name=$1
            local pidFile=$2
            local startCmd=$3

            if [ -f "$pidFile" ] && ps -p $(cat "$pidFile") > /dev/null; then
              echo "$name is already running!"
              return 1
            fi

            eval "$startCmd"
          }

          stopService() {
            local name=$1
            local pidFile=$2

            if [ -f "$pidFile" ]; then
              local pid=$(cat "$pidFile")
              if ps -p $pid > /dev/null; then
                echo "stopping $name..."
                kill $pid
              fi
              rm "$pidFile"
            else
              echo "no $name running"
            fi
          }
        '';

        # Environment variables
        envVars = {
          MINIO_ROOT_USER = "minioadmin";
          MINIO_ROOT_PASSWORD = "minioadmin";
          PROJECT_ROOT = "$(pwd)";
        };

        shellHook = ''
          source ${serviceUtils}/bin/service-utils

          start_minio() {
            local minio_port=$(findFreePort 9500)
            local console_port=$((minio_port + 1))

            mkdir -p ./.minio/data
            startService "minio" "./.minio/minio.pid" "
              ${pkgs.minio}/bin/minio server ./.minio/data \
                --address ':$minio_port' \
                --console-address ':$console_port' &
              echo \$! > ./.minio/minio.pid

              echo 'minio console: http://localhost:$console_port'
              echo 's3 endpoint:   http://localhost:$minio_port'

              export S3_ENDPOINT='http://localhost:$minio_port'
            "
          }

          stop_minio() {
            stopService "minio" "./.minio/minio.pid"
          }

          echo "🌸 aurabloom development environment"
          echo
          echo "available commands:"
          echo "  start_minio  - start minio s3 server"
          echo "  stop_minio   - stop minio s3 server"
          echo

          ${builtins.concatStringsSep "\n" (
            builtins.attrValues (builtins.mapAttrs (name: value: "export ${name}=${value}") envVars)
          )}
        '';
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = devPkgs;
          inherit shellHook;
        };
      }
    );
}
