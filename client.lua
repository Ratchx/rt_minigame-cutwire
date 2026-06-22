local p
local active = false

RegisterNuiCallback('defuseResult', function (data, cb)
    if p then
        p:resolve(data)
        active = false
    end
    cb(1)
end)

exports('Start', function (diff, timer, wireCount, sequenceLength, fakeCount, penaltyCount)
    if active then return false end
    active = true
    p = promise.new()
    local data = {}
    if diff == 'CUSTOM' then
        data = {
            action = 'start',
            wireCount = wireCount,
            sequenceLength = sequenceLength,
            duration = timer,
            difficulty = diff,
            fakeCount = fakeCount,
            penaltyCount = penaltyCount
        }
    else
        data = {
            action = 'start',
            duration = timer,
            difficulty = diff,
        }
    end
    SendNUIMessage(data)
    local result = Citizen.Await(p)
    p = nil
    return result
end)

--   EASY: { wireCount: 12, sequenceLength: 3, fakeCount: 1, penaltyCount: 1 },
--   MEDIUM: { wireCount: 14, sequenceLength: 4, fakeCount: 2, penaltyCount: 2 },
--   HARD: { wireCount: 16, sequenceLength: 5, fakeCount: 3, penaltyCount: 3 },
--   EXPERT: { wireCount: 20, sequenceLength: 6, fakeCount: 3, penaltyCount: 3 },