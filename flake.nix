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

        dbUtils = pkgs.writeScriptBin "db-utils" ''
          #!${pkgs.bash}/bin/bash

          init_db() {
            local db_path=$1
            local schema_dir=$2

            if [ ! -f "$db_path" ]; then
              echo "initializing database at $db_path..."
              mkdir -p $(dirname "$db_path")
              ${pkgs.sqlite}/bin/sqlite3 "$db_path" ""

              echo "running migrations..."
              cd packages/server && bunx drizzle-kit generate && bunx drizzle-kit migrate
              cd ../..
            else
              echo "database already exists at $db_path"
            fi
          }

          check_db() {
            local db_path=$1
            if [ ! -f "$db_path" ]; then
              echo "database not found at $db_path"
              return 1
            fi

            if ! ${pkgs.sqlite}/bin/sqlite3 "$db_path" ".tables" &>/dev/null; then
              echo "database exists but might be corrupted"
              return 1
            fi

            echo "database looks good"
            return 0
          }
        '';

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

        envVars = {
          MINIO_ROOT_USER = "minioadmin";
          MINIO_ROOT_PASSWORD = "minioadmin";
          PROJECT_ROOT = "$(pwd)";
          DATABASE_PATH = "$(pwd)/packages/server/aurabloom.db";
        };

        shellHook = ''
            source ${serviceUtils}/bin/service-utils
            source ${dbUtils}/bin/db-utils

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

            setup_dev() {
              echo "🌸 setting up aurabloom development environment..."

              init_db "$DATABASE_PATH" "packages/server/drizzle"

              if [ ! -f "./.minio/minio.pid" ]; then
              start_minio

              sleep 2

              ${pkgs.awscli2}/bin/aws --endpoint-url $S3_ENDPOINT \
                  s3 mb s3://aurabloom --region us-east-1 2>/dev/null || true
              fi
          }

          echo "🌸 aurabloom development environment"
          echo
          echo "available commands:"
          echo "  setup_dev    - initialize development environment"
          echo "  start_minio  - start minio s3 server"
          echo "  stop_minio   - stop minio s3 server"
          echo

          ${builtins.concatStringsSep "\n" (
            builtins.attrValues (builtins.mapAttrs (name: value: "export ${name}=${value}") envVars)
          )}

          setup_dev
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
