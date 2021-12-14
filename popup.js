let start = document.getElementById("start");
let preCpuInfo;

start.addEventListener("click", ($event) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([{ id }]) => {
        setInterval(() => {
            chrome.system.cpu.getInfo((cpuInfo) => {
                chrome.system.memory.getInfo((memoryInfo) => {
                    let ramUsagePercent = Math.round(100 * (memoryInfo.capacity - memoryInfo.availableCapacity) / memoryInfo.capacity);
                    let cpuUsagePercent = 0;
                    for (let i = 0; i < cpuInfo.numOfProcessors; i++) {
                        let usage = cpuInfo.processors[i].usage;
                        if (preCpuInfo) {
                            let oldUsage = preCpuInfo.processors[i].usage;
                            cpuUsagePercent += Math.floor((usage.kernel + usage.user - oldUsage.kernel - oldUsage.user) / (usage.total - oldUsage.total) * 100);
                        } else {
                            cpuUsagePercent += Math.floor((usage.kernel + usage.user) / usage.total * 100);
                        }
                    }
                    preCpuInfo = cpuInfo;

                    let data = {
                        cpu: Math.round(cpuUsagePercent / cpuInfo.numOfProcessors),
                        ram: ramUsagePercent
                    };
                    chrome.storage.sync.set({ data });
                    chrome.scripting.executeScript({
                        target: { tabId: id },
                        function: sendCPUAndRAMDetails,
                    });
                });
            });
        }, 5000);
    });
});

function sendCPUAndRAMDetails() {
    chrome.storage.sync.get("data", ({ data }) => {
        window.postMessage(data);
    });
}