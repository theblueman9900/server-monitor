const express = require('express');
const os = require('os');
const si = require('systeminformation');
const Docker = require('dockerode');
const app = express();
const docker = new Docker();
const PORT = 4000;
const path = require('path');

// Serve the HTML file
app.use(express.static(path.join(__dirname, 'public')));
app.get('/status', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendData = async () => {
    const metrics = await getMetrics();
    res.write(`data: ${JSON.stringify(metrics)}\n\n`);
  };

  const intervalId = setInterval(sendData, 5000);

  req.on('close', () => {
    clearInterval(intervalId);
  });
});

async function getSystemMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const cpuLoad = await si.currentLoad();
  const battery = await si.battery();
  const diskUsage = await si.fsSize();

  return {
    totalRam: totalMem,
    freeRam: freeMem,
    cpuUsage: cpuLoad.currentLoad,
    battery: battery.percent,
    diskUsage: diskUsage[0].use,
  };
}

async function getContainerMetrics() {
  const containers = await docker.listContainers();
  const containerStats = [];

  for (const containerInfo of containers) {
    const container = docker.getContainer(containerInfo.Id);
    const statsStream = await container.stats({ stream: false });
    containerStats.push({
      id: containerInfo.Id,
      name: containerInfo.Names[0],
      cpuUsage: statsStream.cpu_stats.cpu_usage.total_usage,
      memoryUsage: statsStream.memory_stats.usage,
      memoryLimit: statsStream.memory_stats.limit,
    });
  }
  return containerStats;
}

async function getMetrics() {
  const systemMetrics = await getSystemMetrics();
  const containerMetrics = await getContainerMetrics();
  return {
    system: systemMetrics,
    containers: containerMetrics,
  };
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
