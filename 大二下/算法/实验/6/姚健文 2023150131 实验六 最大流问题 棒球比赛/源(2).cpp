#include <iostream>
#include <vector>
#include <queue>
#include <climits>
#include <chrono>
#include <map>
#include <string>
#include <algorithm>
#include <stack>
#include <sstream>

using namespace std;

class FordFulkerson {
    int n;
    vector<vector<int>> graph;

public:
    FordFulkerson(int size) : n(size), graph(size, vector<int>(size, 0)) {}

    void addEdge(int u, int v, int w) {
        graph[u][v] += w;  // 累加重边容量
    }

    bool dfs(int u, int t, vector<int>& parent) {
        vector<bool> visited(n, false);
        stack<int> stk;
        stk.push(u);
        visited[u] = true;
        parent[u] = -1;

        while (!stk.empty()) {
            int curr = stk.top();
            stk.pop();

            if (curr == t) {
                return true;
            }

            for (int v = 0; v < n; ++v) {
                if (!visited[v] && graph[curr][v] > 0) {
                    visited[v] = true;
                    parent[v] = curr;
                    stk.push(v);
                }
            }
        }
        return false;
    }

    int computeMaxFlow(int s, int t) {
        int maxFlow = 0;
        vector<int> parent(n);

        while (dfs(s, t, parent)) {
            int pathFlow = INT_MAX;
            for (int v = t; v != s; v = parent[v]) {
                int u = parent[v];
                pathFlow = min(pathFlow, graph[u][v]);
            }

            maxFlow += pathFlow;

            for (int v = t; v != s; v = parent[v]) {
                int u = parent[v];
                graph[u][v] -= pathFlow;
                graph[v][u] += pathFlow;
            }
        }
        return maxFlow;
    }
};

// 辅助结构体：存储球队信息
struct TeamInfo {
    string name;//球队名称
    int wins;    // 已胜场数
    int toPlay;  // 剩余比赛场数
    map<string, int> against; // 对阵其他队伍剩余比赛场数
};

// 构建流网络并计算最大流
int buildAndComputeFlow(const map<string, TeamInfo>& allTeams, const string& teamToCheck, int& totalPossibleFlow) {
    vector<string> otherTeams;
    for (auto it = allTeams.begin(); it != allTeams.end(); ++it) {
        if (it->first != teamToCheck) {
            otherTeams.push_back(it->first);
        }
    }
    int k = otherTeams.size();
    if (k < 2) {
        totalPossibleFlow = 0;
        return 0; // 剩余队伍不足2支，无比赛点
    }

    // 计算节点数量：源点(1) + 比赛点(C(k,2)) + 队伍点(k) + 汇点(1)
    int numMatchNodes = k * (k - 1) / 2;
    int totalNodes = 1 + numMatchNodes + k + 1;
    int source = 0;
    int sink = totalNodes - 1;

    FordFulkerson ff(totalNodes);

    // 映射：比赛点名称 -> 节点编号，队伍名称 -> 节点编号
    map<string, int> matchNodeMap;
    map<string, int> teamNodeMap;
    int nodeIdx = 1; // 源点是0，接下来分配比赛点
    for (int i = 0; i < k; ++i) {
        for (int j = i + 1; j < k; ++j) {
            string matchName = otherTeams[i] + "-" + otherTeams[j];
            matchNodeMap[matchName] = nodeIdx++;
        }
    }
    for (int i = 0; i < otherTeams.size(); ++i) {
        teamNodeMap[otherTeams[i]] = nodeIdx++;
    }

    // 1. 源点 -> 比赛点：容量为两队剩余比赛场数
    totalPossibleFlow = 0;
    for (int i = 0; i < k; ++i) {
        for (int j = i + 1; j < k; ++j) {
            string t1 = otherTeams[i];
            string t2 = otherTeams[j];
            string matchName = t1 + "-" + t2;
            int capacity = allTeams.at(t1).against.at(t2);
            ff.addEdge(source, matchNodeMap[matchName], capacity);
            totalPossibleFlow += capacity;
        }
    }
    //cout << "对 " << teamToCheck << " 构建的流网络：源点总流量 = " << totalPossibleFlow << endl;

    // 2. 比赛点 -> 队伍点：容量设为大值（模拟无穷大）
    for (auto matchIt = matchNodeMap.begin(); matchIt != matchNodeMap.end(); ++matchIt) {
        const string& matchName = matchIt->first;
        int matchNode = matchIt->second;
        size_t pos = matchName.find('-');
        string t1 = matchName.substr(0, pos);
        string t2 = matchName.substr(pos + 1);
        ff.addEdge(matchNode, teamNodeMap[t1], 10000);
        ff.addEdge(matchNode, teamNodeMap[t2], 10000);
    }

    // 3. 队伍点 -> 汇点：容量为 w_max + r_x - w_i
    const TeamInfo& targetTeam = allTeams.at(teamToCheck);
    int w_max = targetTeam.wins + targetTeam.toPlay;
    //cout << teamToCheck << " 最大可能胜场数 = " << w_max << endl;

    for (auto teamIt = teamNodeMap.begin(); teamIt != teamNodeMap.end(); ++teamIt) {
        const string& team = teamIt->first;
        int teamNode = teamIt->second;
        const TeamInfo& info = allTeams.at(team);
        int capacity = w_max - info.wins;
        if (capacity < 0) capacity = 0; // 容量不能为负
        ff.addEdge(teamNode, sink, capacity);
        //cout << "  " << team << " 到汇点容量 = " << capacity << " (剩余 " << info.wins << " 胜场)" << endl;
    }

    // 计算最大流
    int maxFlow = ff.computeMaxFlow(source, sink);

    return maxFlow;
}

int main() {

    int n;
    cin >> n;
    cin.ignore(); // 忽略换行符

    vector<string> teamNames(n);
    map<string, TeamInfo> teams;

    // 读取每支队伍的数据
    for (int i = 0; i < n; ++i) {
        string line;
        getline(cin, line);
        stringstream ss(line);

        TeamInfo info;
        ss >> info.name;
        int wins, losses;
        ss >> wins >> losses >> info.toPlay;
        info.wins = wins;

        // 读取与其他队伍的剩余比赛场次
        for (int j = 0; j < n; ++j) {
            int games;
            ss >> games;
            if (j == i) continue; // 跳过与自己的比赛（总是0）
            // 暂时存储索引，稍后填充队伍名称
            info.against[to_string(j)] = games;
        }

        teamNames[i] = info.name;
        teams[info.name] = info;
    }

    // 更新队伍名称（替换索引为实际队伍名称）
    for (auto& teamPair : teams) {
        TeamInfo& info = teamPair.second;
        map<string, int> updatedAgainst;

        for (auto& againstPair : info.against) {
            int opponentIdx = stoi(againstPair.first);
            string opponentName = teamNames[opponentIdx];
            updatedAgainst[opponentName] = againstPair.second;
        }

        info.against = updatedAgainst;
    }




    // 设置运行次数（用于计算平均时间）
    int numRuns;
    cout << "请输入重复运行的次数：";
    cin >> numRuns;

    // 存储各队伍结果
    map<string, pair<bool, int>> results;

    double totalProcessingTime = 0;
    int teamCount = 0;

    // 对每支队伍进行判断
    for (auto it = teams.begin(); it != teams.end(); ++it) {
        teamCount++;
        const string& teamName = it->first;
        const TeamInfo& teamInfo = it->second;

        cout << "\n分析队伍" << teamName << "：" << endl;
        //cout << "当前胜场: " << teamInfo.wins << ", 剩余比赛: " << teamInfo.toPlay << endl;

        // 简单判断：是否已确定淘汰
        bool simpleEliminated = false;
        for (auto otherIt = teams.begin(); otherIt != teams.end(); ++otherIt) {
            if (otherIt->first != teamName &&
                (teamInfo.wins + teamInfo.toPlay) < otherIt->second.wins) {
                simpleEliminated = true;
                cout << "【简单判断】已被 " << otherIt->first << " 淘汰（"
                    << teamInfo.wins + teamInfo.toPlay << " < " << otherIt->second.wins << "）" << endl;
                break;
            }
        }
        if (simpleEliminated) {
            results[teamName] = make_pair(true, teamInfo.wins + teamInfo.toPlay);
            continue;
        }
        

        // 计算源点可提供的总流量（其他队间未进行比赛的总数）
        int totalPossibleFlow = 0;
        vector<string> otherTeams;
        for (auto tmpIt = teams.begin(); tmpIt != teams.end(); ++tmpIt) {
            if (tmpIt->first != teamName) {
                otherTeams.push_back(tmpIt->first);
            }
        }

        for (int i = 0; i < otherTeams.size(); ++i) {
            for (int j = i + 1; j < otherTeams.size(); ++j) {
                totalPossibleFlow += teams.at(otherTeams[i]).against.at(otherTeams[j]);
            }
        }



        // 多次运行计时
        auto startTotal = chrono::high_resolution_clock::now();
        int maxFlow = 0;

        for (int run = 0; run < numRuns; ++run) {
            int flow = 0;
            int possibleFlow = 0;
            flow = buildAndComputeFlow(teams, teamName, possibleFlow);

            if (run == 0) { // 只保存第一次的结果用于判断淘汰
                maxFlow = flow;
                totalPossibleFlow = possibleFlow;
            }
        }
        cout << "计算得到的最大流值为：" << maxFlow << endl;

        auto endTotal = chrono::high_resolution_clock::now();
        auto duration = chrono::duration_cast<chrono::nanoseconds>(endTotal - startTotal);
        double avgTime = duration.count() / (double)numRuns;
        totalProcessingTime += avgTime;


        // 判断是否淘汰
        bool isEliminated = (maxFlow != totalPossibleFlow);
        if (isEliminated) {
            cout << "【FF算法最大流判断】已被淘汰（最大流 " << maxFlow
                << " < 总流量 " << totalPossibleFlow << "）" << endl;
        }
        else {
            cout << "【FF算法最大流判断】未被淘汰（最大流 = 总流量 = " << maxFlow << "）" << endl;
        }

        results[teamName] = make_pair(isEliminated, teamInfo.wins + teamInfo.toPlay);
        cout << "平均计算时间: " << avgTime/1000 << " μs" << endl;
    }

    // 输出最终结果
    cout << "\n\n==== 最终结果汇总 ====" << endl;
    for (auto resIt = results.begin(); resIt != results.end(); ++resIt) {
        const string& teamName = resIt->first;
        bool eliminated = resIt->second.first;
        int maxWins = resIt->second.second;

        if (eliminated) {
            cout << teamName << " 已被淘汰。最大可能胜场数: " << maxWins << endl;
        }
        else {
            cout << teamName << " 未被淘汰。最大可能胜场数: " << maxWins << endl;
        }
        
    }
    cout << "求出全部队伍结果的平均运行时间：" << totalProcessingTime / teamCount / 1000 << "μs" << endl;

    return 0;
}