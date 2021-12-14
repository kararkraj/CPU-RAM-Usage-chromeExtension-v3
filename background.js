let preCpuInfo, interval, tabId;

chrome.webNavigation.onCompleted.addListener(() => {
    getCPUAndRAMDetails();
});

chrome.tabs.onRemoved.addListener((id) => {
    if (id === tabId) {
        clearInterval(interval);
        interval = undefined;
        chrome.tabs.onRemoved.removeListener();
    }
});

function getCPUAndRAMDetails() {
    chrome.tabs.query({ active: true, currentWindow: true }).then((tab) => {
        if (tab[0].url.includes("localhost") && !interval) {
            tabId = tab[0].id;
            interval = setInterval(() => {
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
                        chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            function: sendCPUAndRAMDetails,
                            args: [data]
                        });
                    });
                });
            }, 2000);
        }
    }).catch((err) => {
        console.log(err);
    });
}

function sendCPUAndRAMDetails(data) {
    window.postMessage(data);
}