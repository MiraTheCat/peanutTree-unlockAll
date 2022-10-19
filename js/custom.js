function upgradeCount(layer) {
    let count = 0;

    if (hasUpgrade(layer, 11)) count += 1;
    if (hasUpgrade(layer, 12)) count += 1;
    if (hasUpgrade(layer, 13)) count += 1;

    if (hasUpgrade(layer, 21)) count += 1;
    if (hasUpgrade(layer, 22)) count += 1;
    if (hasUpgrade(layer, 23)) count += 1;

    if (hasUpgrade(layer, 31)) count += 1;
    if (hasUpgrade(layer, 32)) count += 1;
    if (hasUpgrade(layer, 33)) count += 1;

    return count;
}

function challengeCompletions(layer) {
    let count = 0;

    if (hasChallenge(layer, 11)) count += 1;
    if (hasChallenge(layer, 12)) count += 1;
    
    if (hasChallenge(layer, 21)) count += 1;
    if (hasChallenge(layer, 22)) count += 1;

    return count;
}