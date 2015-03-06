workingDir=$(pwd)
targetDir=$(mktemp -d)

for f in background.js manifest.json
do
    cp $f $targetDir
done

echo Output to: $targetDir

