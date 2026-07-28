import satori from 'satori';
import fs from 'fs';

async function run() {
  const mapTiles = [
    {
      x: -375.212, y: -744.532,
      dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVQI12P8//8/AwMDEwMDAwMDAwMAUAAH/b5xJ9AAAAAASUVORK5CYII='
    }
  ];
  
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          backgroundColor: '#09090b',
          position: 'relative',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                opacity: 0.7,
              },
              children: mapTiles.map(t => ({
                type: 'img',
                props: {
                  src: t.dataUri,
                  style: {
                    position: 'absolute',
                    left: t.x,
                    top: t.y,
                    width: 1024,
                    height: 1024,
                  }
                }
              }))
            }
          }
        ]
      }
    },
    { width: 1200, height: 630 }
  );
  console.log(svg);
}
run();
